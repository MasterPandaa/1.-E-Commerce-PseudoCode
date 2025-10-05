// PSEUDO: Cart-related DB operations
import { query } from '../config/database.js';

export async function getOrCreateCartId(userId) {
  const rows = await query('SELECT id FROM carts WHERE user_id = ? LIMIT 1', [userId]);
  if (rows.length) return rows[0].id;
  const res = await query('INSERT INTO carts (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())', [userId]);
  return res.insertId;
}

export async function upsertCartItem(cartId, productId, quantity) {
  const sql =
    'INSERT INTO cart_items (cart_id, product_id, quantity, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), 999), updated_at = NOW()';
  const res = await query(sql, [cartId, productId, quantity]);
  return res.affectedRows;
}

export async function setCartItemQuantity(cartId, productId, quantity) {
  const res = await query('UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE cart_id = ? AND product_id = ?', [quantity, cartId, productId]);
  return res.affectedRows;
}

export async function removeCartItem(cartId, productId) {
  const res = await query('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, productId]);
  return res.affectedRows;
}

export async function clearCartItems(cartId) {
  const res = await query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
  return res.affectedRows;
}

export async function getCartItemsWithProducts(cartId) {
  const sql =
    'SELECT ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ? AND p.is_deleted = 0';
  const rows = await query(sql, [cartId]);
  return rows;
}
