// PSEUDO: Cart controller (stubs for now)
import * as cartService from '../services/cart.service.js';

// PSEUDO: Add Item to Cart
export async function addItem(req, res) {
  const { productId, quantity } = req.body;
  const result = await cartService.addItem(req.user.id, productId, quantity);
  if (result.type === 'success') return res.status(200).json({ message: result.message });
  if (result.type === 'validation_error') return res.status(400).json({ error: { message: result.message } });
  if (result.type === 'not_found') return res.status(404).json({ error: { message: result.message } });
  return res.status(500).json({ error: { message: 'Failed to add item' } });
}

// PSEUDO: Update Item Quantity in Cart
export async function updateItem(req, res) {
  const { quantity } = req.body;
  const result = await cartService.updateItem(req.user.id, req.params.productId, quantity);
  if (result.type === 'success') return res.status(200).json({ message: result.message });
  if (result.type === 'validation_error') return res.status(400).json({ error: { message: result.message } });
  if (result.type === 'not_found') return res.status(404).json({ error: { message: result.message } });
  return res.status(500).json({ error: { message: 'Failed to update item' } });
}

// PSEUDO: Remove Item from Cart
export async function removeItem(req, res) {
  const result = await cartService.removeItem(req.user.id, req.params.productId);
  if (result.type === 'success') return res.status(200).json({ message: result.message });
  if (result.type === 'validation_error') return res.status(400).json({ error: { message: result.message } });
  if (result.type === 'not_found') return res.status(404).json({ error: { message: result.message } });
  return res.status(500).json({ error: { message: 'Failed to remove item' } });
}

// PSEUDO: Get Cart Contents
export async function getCart(req, res) {
  const result = await cartService.getCart(req.user.id);
  if (result.type === 'success') return res.status(200).json(result.data);
  return res.status(500).json({ error: { message: 'Failed to fetch cart' } });
}

// PSEUDO: Clear Cart
export async function clearCart(req, res) {
  const result = await cartService.clear(req.user.id);
  if (result.type === 'success') return res.status(200).json({ message: result.message });
  return res.status(500).json({ error: { message: 'Failed to clear cart' } });
}

// PSEUDO: Merge Guest Cart
export async function mergeCart(req, res) {
  const result = await cartService.merge(req.user.id, req.body.items || []);
  if (result.type === 'success') return res.status(200).json({ message: result.message });
  if (result.type === 'validation_error') return res.status(400).json({ error: { message: result.message } });
  return res.status(500).json({ error: { message: 'Failed to merge cart' } });
}
