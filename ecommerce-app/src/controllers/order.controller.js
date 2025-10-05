// PSEUDO: Order/Checkout controller (stubs for now)
import * as orderService from '../services/order.service.js'
import path from 'path'

// PSEUDO: Validate Checkout Data
export async function validateCheckout (req, res) {
  const { address, payment, idempotencyKey } = req.body
  const result = await orderService.validateCheckout(
    req.user.id,
    address,
    payment,
    idempotencyKey
  )
  if (result.type === 'success') return res.status(200).json(result.data)
  if (result.type === 'idempotent') return res.status(200).json(result.data)
  if (result.type === 'validation_error') {
    return res.status(400).json({ error: { message: result.message } })
  }
  return res.status(500).json({ error: { message: 'Validation failed' } })
}

// PSEUDO: Place Order
export async function placeOrder (req, res) {
  const { address, payment, idempotencyKey } = req.body
  const result = await orderService.placeOrder(
    req.user.id,
    address,
    payment,
    idempotencyKey
  )
  if (result.type === 'success') return res.status(201).json(result.data)
  if (result.type === 'validation_error') {
    return res.status(400).json({ error: { message: result.message } })
  }
  if (result.type === 'conflict_error') {
    return res.status(409).json({ error: { message: result.message } })
  }
  if (result.type === 'payment_error') {
    return res.status(402).json({ error: { message: result.message } })
  }
  return res.status(500).json({ error: { message: 'Failed to place order' } })
}

// PSEUDO: Get Invoice
export async function getInvoice (req, res) {
  const result = await orderService.getInvoice(req.params.id, req.user)
  if (result.type === 'success') {
    const filePath = result.data.filePath
    return res.sendFile(path.resolve(filePath))
  }
  if (result.type === 'auth_error') {
    return res.status(403).json({ error: { message: result.message } })
  }
  if (result.type === 'not_found') {
    return res.status(404).json({ error: { message: result.message } })
  }
  if (result.type === 'validation_error') {
    return res.status(400).json({ error: { message: result.message } })
  }
  return res
    .status(500)
    .json({ error: { message: 'Failed to generate invoice' } })
}
