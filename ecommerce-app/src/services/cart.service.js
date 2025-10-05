// PSEUDO: Cart service per pseudo-code
import {
  getOrCreateCartId,
  upsertCartItem,
  setCartItemQuantity,
  removeCartItem,
  clearCartItems,
  getCartItemsWithProducts
} from '../models/cart.model.js'
import { getProductStockAndPrice } from '../models/product.model.js'

export async function addItem (userId, productId, quantity) {
  const pid = parseInt(productId, 10)
  const qty = parseInt(quantity, 10)
  if (
    !Number.isInteger(pid) ||
    pid <= 0 ||
    !Number.isInteger(qty) ||
    qty < 1 ||
    qty > 999
  ) {
    return { type: 'validation_error', message: 'Invalid input' }
  }
  const product = await getProductStockAndPrice(pid)
  if (!product) return { type: 'not_found', message: 'Product not found' }
  if (product.stock < qty) {
    return { type: 'validation_error', message: 'Insufficient stock' }
  }
  const cartId = await getOrCreateCartId(userId)
  await upsertCartItem(cartId, pid, qty)
  return { type: 'success', message: 'Added to cart' }
}

export async function updateItem (userId, productId, quantity) {
  const pid = parseInt(productId, 10)
  const qty = parseInt(quantity, 10)
  if (
    !Number.isInteger(pid) ||
    pid <= 0 ||
    !Number.isInteger(qty) ||
    qty < 1 ||
    qty > 999
  ) {
    return { type: 'validation_error', message: 'Invalid quantity' }
  }
  const product = await getProductStockAndPrice(pid)
  if (!product) return { type: 'not_found', message: 'Product not found' }
  if (product.stock < qty) {
    return { type: 'validation_error', message: 'Insufficient stock' }
  }
  const cartId = await getOrCreateCartId(userId)
  const affected = await setCartItemQuantity(cartId, pid, qty)
  if (affected === 0) return { type: 'not_found', message: 'Item not in cart' }
  return { type: 'success', message: 'Quantity updated' }
}

export async function removeItem (userId, productId) {
  const pid = parseInt(productId, 10)
  if (!Number.isInteger(pid) || pid <= 0) {
    return { type: 'validation_error', message: 'Invalid product id' }
  }
  const cartId = await getOrCreateCartId(userId)
  const affected = await removeCartItem(cartId, pid)
  if (affected === 0) return { type: 'not_found', message: 'Item not in cart' }
  return { type: 'success', message: 'Removed' }
}

export async function getCart (userId) {
  const cartId = await getOrCreateCartId(userId)
  const rows = await getCartItemsWithProducts(cartId)
  let subtotal = 0
  const items = rows.map((r) => {
    const lineTotal = Number(r.price) * r.quantity
    subtotal += lineTotal
    return {
      productId: r.product_id,
      name: r.name,
      price: Number(r.price),
      quantity: r.quantity,
      imageUrl: r.image_url,
      lineTotal
    }
  })
  const tax = 0
  const shipping = 0
  const total = subtotal + tax + shipping
  return { type: 'success', data: { items, subtotal, tax, shipping, total } }
}

export async function clear (userId) {
  const cartId = await getOrCreateCartId(userId)
  await clearCartItems(cartId)
  return { type: 'success', message: 'Cleared' }
}

export async function merge (userId, items) {
  if (!Array.isArray(items) || items.length > 100) {
    return { type: 'validation_error', message: 'Invalid cart' }
  }
  const cartId = await getOrCreateCartId(userId)
  for (const it of items) {
    const pid = parseInt(it.productId, 10)
    const qty = parseInt(it.quantity, 10)
    if (
      !Number.isInteger(pid) ||
      pid <= 0 ||
      !Number.isInteger(qty) ||
      qty < 1
    ) {
      continue
    }
    const product = await getProductStockAndPrice(pid)
    if (!product) continue
    const allowedQty = Math.min(qty, product.stock, 999)
    if (allowedQty < 1) continue
    await upsertCartItem(cartId, pid, allowedQty)
  }
  return { type: 'success', message: 'Merged' }
}
