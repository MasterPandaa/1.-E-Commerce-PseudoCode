// PSEUDO: Product controller (stubs for now)
import * as productService from '../services/product.service.js'

// PSEUDO: Create Product (admin only, image upload, validation)
export async function createProduct (req, res) {
  const result = await productService.create(req.body, req.file, req.user)
  if (result.type === 'success') return res.status(201).json(result.data)
  if (result.type === 'auth_error') {
    return res.status(403).json({ error: { message: result.message } })
  }
  if (result.type === 'validation_error') {
    return res.status(400).json({ error: { message: result.message } })
  }
  return res
    .status(500)
    .json({ error: { message: 'Failed to create product' } })
}

// PSEUDO: List Products (pagination, filters, search)
export async function listProducts (req, res) {
  const result = await productService.list(req.query)
  if (result.type === 'success') return res.status(200).json(result.data)
  if (result.type === 'validation_error') {
    return res.status(400).json({ error: { message: result.message } })
  }
  return res
    .status(500)
    .json({ error: { message: 'Failed to fetch products' } })
}

// PSEUDO: Get Single Product
export async function getProduct (req, res) {
  const result = await productService.get(req.params.id)
  if (result.type === 'success') return res.status(200).json(result.data)
  if (result.type === 'not_found') {
    return res.status(404).json({ error: { message: result.message } })
  }
  if (result.type === 'validation_error') {
    return res.status(400).json({ error: { message: result.message } })
  }
  return res
    .status(500)
    .json({ error: { message: 'Failed to fetch product' } })
}

// PSEUDO: Update Product (admin only)
export async function updateProduct (req, res) {
  const result = await productService.update(
    req.params.id,
    req.body,
    req.file,
    req.user
  )
  if (result.type === 'success') {
    return res.status(200).json({ message: 'Updated' })
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
    .json({ error: { message: 'Failed to update product' } })
}

// PSEUDO: Delete Product (admin only)
export async function deleteProduct (req, res) {
  const result = await productService.remove(req.params.id, req.user)
  if (result.type === 'success') {
    return res.status(200).json({ message: 'Deleted' })
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
    .json({ error: { message: 'Failed to delete product' } })
}
