// PSEUDO: Admin service per pseudo-code
import { findLowStockProducts } from '../models/product.model.js';
import {
  getSalesStats,
  findOrdersAdmin,
  updateOrderStatus as updateOrderStatusModel,
  getOrderWithItems,
  restoreStock,
} from '../models/order.model.js';
import { findUsersAdmin, setUserStatus, revokeAllRefreshTokensForUser } from '../models/user.model.js';

function invalidTransition(from, to) {
  const allowed = {
    pending: ['paid', 'cancelled'],
    paid: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
    payment_failed: [],
  };
  return !(allowed[from] || []).includes(to);
}

export async function getSalesStatsAdmin(currentUser, query) {
  if (!currentUser || currentUser.role !== 'admin') return { type: 'auth_error', message: 'Forbidden' };
  const startDate = query.startDate || '1970-01-01';
  const endDate = query.endDate || '2999-12-31';
  const groupBy = ['day', 'week', 'month'].includes(query.groupBy) ? query.groupBy : 'day';
  const data = await getSalesStats({ startDate, endDate, groupBy });
  return { type: 'success', data };
}

export async function getOrdersAdmin(currentUser, query) {
  if (!currentUser || currentUser.role !== 'admin') return { type: 'auth_error', message: 'Forbidden' };
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
  const status = query.status || null;
  const userId = query.userId ? parseInt(query.userId, 10) : null;
  const startDate = query.startDate || null;
  const endDate = query.endDate || null;
  const data = await findOrdersAdmin({ page, limit, status, userId, startDate, endDate });
  return { type: 'success', data: { ...data, page, limit } };
}

export async function updateOrderStatus(currentUser, orderId, newStatus) {
  if (!currentUser || currentUser.role !== 'admin') return { type: 'auth_error', message: 'Forbidden' };
  const oid = parseInt(orderId, 10);
  if (!Number.isInteger(oid) || oid <= 0) return { type: 'validation_error', message: 'Invalid order id' };
  if (!['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) {
    return { type: 'validation_error', message: 'Invalid status' };
  }
  const { order, items } = await getOrderWithItems(oid);
  if (!order) return { type: 'not_found', message: 'Order not found' };
  if (invalidTransition(order.status, newStatus)) {
    return { type: 'validation_error', message: 'Invalid transition' };
  }
  // Apply update
  await updateOrderStatusModel(oid, newStatus);
  if (newStatus === 'cancelled' && ['pending', 'paid'].includes(order.status)) {
    await restoreStock(items);
  }
  return { type: 'success', message: 'Status updated' };
}

export async function getUsersAdmin(currentUser, query) {
  if (!currentUser || currentUser.role !== 'admin') return { type: 'auth_error', message: 'Forbidden' };
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
  const q = query.q ? String(query.q) : null;
  const status = query.status || null;
  const role = query.role || null;
  const data = await findUsersAdmin({ page, limit, q, status, role });
  return { type: 'success', data: { ...data, page, limit } };
}

export async function changeUserStatusAdmin(currentUser, userId, status) {
  if (!currentUser || currentUser.role !== 'admin') return { type: 'auth_error', message: 'Forbidden' };
  const uid = parseInt(userId, 10);
  if (!Number.isInteger(uid) || uid <= 0) return { type: 'validation_error', message: 'Invalid user id' };
  if (!['active', 'suspended'].includes(status)) return { type: 'validation_error', message: 'Invalid status' };
  const affected = await setUserStatus(uid, status);
  if (affected === 0) return { type: 'not_found', message: 'User not found' };
  if (status === 'suspended') {
    await revokeAllRefreshTokensForUser(uid);
  }
  return { type: 'success', message: 'User status updated' };
}

export async function lowStockProductsAdmin(currentUser, query) {
  if (!currentUser || currentUser.role !== 'admin') return { type: 'auth_error', message: 'Forbidden' };
  const threshold = query.threshold ? parseInt(query.threshold, 10) : 5;
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
  const data = await findLowStockProducts(threshold, page, limit);
  return { type: 'success', data };
}
