// PSEUDO: Admin controller (stubs for now)
import * as adminService from '../services/admin.service.js'

export async function getSalesStats (req, res) {
  const result = await adminService.getSalesStatsAdmin(req.user, req.query)
  if (result.type === 'success') return res.status(200).json(result.data)
  if (result.type === 'auth_error') {
    return res.status(403).json({ error: { message: result.message } })
  }
  return res.status(500).json({ error: { message: 'Failed to fetch stats' } })
}

export async function getOrders (req, res) {
  const result = await adminService.getOrdersAdmin(req.user, req.query)
  if (result.type === 'success') return res.status(200).json(result.data)
  if (result.type === 'auth_error') {
    return res.status(403).json({ error: { message: result.message } })
  }
  if (result.type === 'validation_error') {
    return res.status(400).json({ error: { message: result.message } })
  }
  return res.status(500).json({ error: { message: 'Failed to fetch orders' } })
}

export async function updateOrderStatus (req, res) {
  const result = await adminService.updateOrderStatus(
    req.user,
    req.params.id,
    req.body.status
  )
  if (result.type === 'success') {
    return res.status(200).json({ message: result.message })
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
    .json({ error: { message: 'Failed to update order status' } })
}

export async function getUsers (req, res) {
  const result = await adminService.getUsersAdmin(req.user, req.query)
  if (result.type === 'success') return res.status(200).json(result.data)
  if (result.type === 'auth_error') {
    return res.status(403).json({ error: { message: result.message } })
  }
  if (result.type === 'validation_error') {
    return res.status(400).json({ error: { message: result.message } })
  }
  return res.status(500).json({ error: { message: 'Failed to fetch users' } })
}

export async function changeUserStatus (req, res) {
  const result = await adminService.changeUserStatusAdmin(
    req.user,
    req.params.id,
    req.body.status
  )
  if (result.type === 'success') {
    return res.status(200).json({ message: result.message })
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
    .json({ error: { message: 'Failed to change user status' } })
}

export async function lowStockProducts (req, res) {
  const result = await adminService.lowStockProductsAdmin(req.user, req.query)
  if (result.type === 'success') return res.status(200).json(result.data)
  if (result.type === 'auth_error') {
    return res.status(403).json({ error: { message: result.message } })
  }
  return res
    .status(500)
    .json({ error: { message: 'Failed to fetch low-stock products' } })
}
