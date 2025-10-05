// PSEUDO: Order-related DB operations
import { query } from '../config/database.js'

export async function getOrderById (orderId) {
  const rows = await query('SELECT * FROM orders WHERE id = ? LIMIT 1', [
    orderId
  ])
  return rows[0] || null
}

export async function getOrderWithItems (orderId) {
  const order = await getOrderById(orderId)
  if (!order) return { order: null, items: [] }
  const items = await query(
    'SELECT product_id, unit_price, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  )
  return { order, items }
}

export async function userOwnsOrder (userId, orderId) {
  const rows = await query(
    'SELECT 1 FROM orders WHERE id = ? AND user_id = ? LIMIT 1',
    [orderId, userId]
  )
  return rows.length > 0
}

export async function hasProcessedIdempotency (userId, key) {
  const rows = await query(
    'SELECT order_id FROM idempotency_keys WHERE user_id = ? AND key_value = ? LIMIT 1',
    [userId, key]
  )
  return rows[0] || null
}

export async function storeIdempotencyKey (userId, key, orderId) {
  const res = await query(
    'INSERT INTO idempotency_keys (user_id, key_value, order_id, created_at) VALUES (?, ?, ?, NOW())',
    [userId, key, orderId]
  )
  return res.insertId
}

// The following functions require a transaction connection to ensure locking
export async function getCartItemsForCheckout (conn, userId) {
  const [rows] = await conn.execute(
    'SELECT p.id as product_id, p.price, p.stock, ci.quantity FROM carts c JOIN cart_items ci ON ci.cart_id = c.id JOIN products p ON p.id = ci.product_id WHERE c.user_id = ? AND p.is_deleted = 0 FOR UPDATE',
    [userId]
  )
  return rows
}

export async function deductStock (conn, productId, quantity) {
  const [res] = await conn.execute(
    'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
    [quantity, productId, quantity]
  )
  return res.affectedRows
}

export async function createOrder (
  conn,
  userId,
  address,
  totals,
  paymentStatus,
  paymentId
) {
  const [res] = await conn.execute(
    'INSERT INTO orders (user_id, status, payment_status, payment_id, subtotal, tax, shipping, total, shipping_name, shipping_line1, shipping_line2, shipping_city, shipping_postal, shipping_country, created_at, updated_at) VALUES (?, "pending", ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [
      userId,
      paymentStatus,
      paymentId || null,
      totals.subtotal,
      totals.tax,
      totals.shipping,
      totals.total,
      address.name,
      address.line1,
      address.line2 || null,
      address.city,
      address.postal,
      address.country
    ]
  )
  return res.insertId
}

export async function createOrderItems (conn, orderId, items) {
  for (const item of items) {
    await conn.execute(
      'INSERT INTO order_items (order_id, product_id, unit_price, quantity, created_at) VALUES (?, ?, ?, ?, NOW())',
      [orderId, item.productId, item.unitPrice, item.quantity]
    )
  }
}

// Admin helpers
export async function getSalesStats ({ startDate, endDate, groupBy }) {
  const totals = await query(
    "SELECT SUM(total) as revenue, COUNT(*) as orders FROM orders WHERE status IN ('paid','shipped','delivered') AND created_at BETWEEN ? AND ?",
    [startDate, endDate]
  )
  const fmt =
    groupBy === 'week' ? '%x-%v' : groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d'
  const series = await query(
    `SELECT DATE_FORMAT(created_at, '${fmt}') as period, SUM(total) as revenue, COUNT(*) as orders FROM orders WHERE status IN ('paid','shipped','delivered') AND created_at BETWEEN ? AND ? GROUP BY period ORDER BY period ASC`,
    [startDate, endDate]
  )
  return { totals: totals[0] || { revenue: 0, orders: 0 }, series }
}

export async function findOrdersAdmin ({
  page,
  limit,
  status,
  userId,
  startDate,
  endDate
}) {
  let base = 'FROM orders o WHERE 1=1'
  const params = []
  if (status) {
    base += ' AND o.status = ?'
    params.push(status)
  }
  if (userId) {
    base += ' AND o.user_id = ?'
    params.push(userId)
  }
  if (startDate && endDate) {
    base += ' AND o.created_at BETWEEN ? AND ?'
    params.push(startDate, endDate)
  }
  const totalRows = await query(`SELECT COUNT(*) as total ${base}`, params)
  const total = totalRows[0]?.total || 0
  const items = await query(
    `SELECT o.id, o.user_id, o.status, o.total, o.created_at ${base} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  )
  return { total, items }
}

export async function updateOrderStatus (orderId, newStatus) {
  const res = await query(
    'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
    [newStatus, orderId]
  )
  return res.affectedRows
}

export async function restoreStock (items) {
  for (const it of items) {
    await query('UPDATE products SET stock = stock + ? WHERE id = ?', [
      it.quantity,
      it.product_id
    ])
  }
}
