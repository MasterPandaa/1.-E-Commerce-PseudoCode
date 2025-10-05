// PSEUDO: Order/Checkout service implementing validateCheckout and placeOrder
import dayjs from 'dayjs';
import { getConnection } from '../config/database.js';
import { getUserById } from '../models/user.model.js';
import {
  getCartItemsForCheckout,
  deductStock,
  createOrder,
  createOrderItems,
  hasProcessedIdempotency,
  storeIdempotencyKey,
  getOrderById,
  getOrderWithItems,
  userOwnsOrder,
} from '../models/order.model.js';
import { clearCartItems, getOrCreateCartId } from '../models/cart.model.js';
import * as paymentProvider from './payment.service.js';
import { generateInvoice } from './pdf.service.js';
import { sendOrderConfirmationEmail } from './email.service.js';

function calcTax(subtotal) { return 0; }
function calcShipping(subtotal) { return 0; }

export async function validateCheckout(userId, address, payment, idempotencyKey) {
  if (!idempotencyKey || String(idempotencyKey).length < 10) {
    return { type: 'validation_error', message: 'Missing idempotency key' };
  }
  if (!address || !address.name || !address.line1 || !address.city || !address.postal || !address.country) {
    return { type: 'validation_error', message: 'Invalid address' };
  }
  if (!payment || !['card', 'cod'].includes(payment.method)) {
    return { type: 'validation_error', message: 'Invalid payment method' };
  }
  const prev = await hasProcessedIdempotency(userId, idempotencyKey);
  if (prev && prev.order_id) {
    const order = await getOrderById(prev.order_id);
    return { type: 'idempotent', data: order };
  }
  return { type: 'success', data: { address, payment, idempotencyKey } };
}

export async function placeOrder(userId, address, payment, idempotencyKey) {
  // Step 1: Validate
  const v = await validateCheckout(userId, address, payment, idempotencyKey);
  if (v.type !== 'success' && v.type !== 'idempotent') return v;
  if (v.type === 'idempotent') return { type: 'success', data: v.data };

  // Step 2: Build totals from cart
  const conn = await getConnection();
  let orderItems = [];
  let totals = { subtotal: 0, tax: 0, shipping: 0, total: 0 };
  try {
    await conn.beginTransaction();
    const rows = await getCartItemsForCheckout(conn, userId); // locks products rows
    if (!rows || rows.length === 0) {
      await conn.rollback();
      return { type: 'validation_error', message: 'Cart is empty' };
    }
    let subtotal = 0;
    orderItems = rows.map((r) => {
      if (r.quantity <= 0) throw new Error('Invalid quantity in cart');
      if (r.stock < r.quantity) throw new Error(`Insufficient stock for product ${r.product_id}`);
      const line = Number(r.price) * r.quantity;
      subtotal += line;
      return { productId: r.product_id, unitPrice: Number(r.price), quantity: r.quantity };
    });
    const tax = calcTax(subtotal);
    const shipping = calcShipping(subtotal);
    const total = subtotal + tax + shipping;
    totals = { subtotal, tax, shipping, total };
    await conn.commit(); // release locks before external call
  } catch (e) {
    try { await conn.rollback(); } catch {}
    conn.release();
    if (e.message && e.message.startsWith('Insufficient stock')) {
      return { type: 'validation_error', message: e.message };
    }
    if (e.message && e.message.startsWith('Invalid quantity')) {
      return { type: 'validation_error', message: e.message };
    }
    return { type: 'server_error', message: 'Checkout failed' };
  }

  // Step 3: Process payment
  const paymentResp = await paymentProvider.charge({
    method: payment.method,
    card: payment.method === 'card' ? { number: payment.cardNumber, expiry: payment.expiry, cvv: payment.cvv } : null,
    amount: totals.total,
    currency: 'USD',
    idempotencyKey,
  });
  if (paymentResp.status !== 'approved') {
    return { type: 'payment_error', message: paymentResp.reason || 'Payment declined' };
  }

  // Step 4: Deduct stock and create order atomically
  const conn2 = await getConnection();
  let orderId = null;
  try {
    await conn2.beginTransaction();
    for (const item of orderItems) {
      const affected = await deductStock(conn2, item.productId, item.quantity);
      if (affected === 0) {
        throw new Error('stock_conflict');
      }
    }
    orderId = await createOrder(conn2, userId, address, totals, 'paid', paymentResp.paymentId);
    await createOrderItems(conn2, orderId, orderItems);
    await storeIdempotencyKey(userId, idempotencyKey, orderId);
    const cartId = await getOrCreateCartId(userId);
    await clearCartItems(cartId);
    await conn2.commit();
  } catch (e) {
    try { await conn2.rollback(); } catch {}
    // Attempt refund
    try { await paymentProvider.refund(paymentResp.paymentId); } catch {}
    if (e.message === 'stock_conflict') {
      return { type: 'conflict_error', message: 'Stock changed; order not placed' };
    }
    return { type: 'server_error', message: 'Failed to place order' };
  } finally {
    conn2.release();
  }

  // Step 5: Generate invoice & send email (best-effort)
  try {
    const { order, items } = await getOrderWithItems(orderId);
    await generateInvoice(order, items);
    const user = await getUserById(userId);
    if (user) await sendOrderConfirmationEmail(user.email, orderId);
  } catch (e) {
    // log only
  }

  return { type: 'success', data: { orderId, total: totals.total } };
}

export async function getInvoice(orderId, currentUser) {
  const oid = parseInt(orderId, 10);
  if (!Number.isInteger(oid) || oid <= 0) return { type: 'validation_error', message: 'Invalid order id' };
  const owns = currentUser.role === 'admin' ? true : await userOwnsOrder(currentUser.id, oid);
  if (!owns) return { type: 'auth_error', message: 'Forbidden' };
  const { order, items } = await getOrderWithItems(oid);
  if (!order) return { type: 'not_found', message: 'Order not found' };
  const pdf = await generateInvoice(order, items);
  return { type: 'success', data: pdf };
}
