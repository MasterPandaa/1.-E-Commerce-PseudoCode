// PSEUDO: Product-related DB operations
import { query } from '../config/database.js'

export async function getCategoryById (categoryId) {
  const rows = await query('SELECT id FROM categories WHERE id = ? LIMIT 1', [
    categoryId
  ])
  return rows[0] || null
}

export async function findLowStockProducts (threshold, page, limit) {
  const t = Number.isInteger(threshold) ? threshold : 5
  const p = Math.max(page || 1, 1)
  const l = Math.min(Math.max(limit || 20, 1), 100)
  const count = await query(
    'SELECT COUNT(*) as total FROM products WHERE is_deleted = 0 AND stock <= ?',
    [t]
  )
  const total = count[0]?.total || 0
  const items = await query(
    'SELECT id, name, stock, price FROM products WHERE is_deleted = 0 AND stock <= ? ORDER BY stock ASC, name ASC LIMIT ? OFFSET ?',
    [t, l, (p - 1) * l]
  )
  return { total, items, page: p, limit: l }
}

export async function createProductRecord ({
  name,
  description,
  price,
  categoryId,
  stock,
  imageUrl
}) {
  const res = await query(
    'INSERT INTO products (name, description, price, category_id, stock, image_url, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 0)',
    [name, description, price, categoryId, stock, imageUrl]
  )
  return res.insertId
}

export async function getProductById (id) {
  const rows = await query(
    'SELECT id, name, description, price, category_id, stock, image_url, created_at, updated_at FROM products WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [id]
  )
  return rows[0] || null
}

export async function getProductStockAndPrice (productId) {
  const rows = await query(
    'SELECT id, stock, price FROM products WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [productId]
  )
  return rows[0] || null
}

export async function softDeleteProduct (id) {
  const res = await query(
    'UPDATE products SET is_deleted = 1, updated_at = NOW() WHERE id = ? AND is_deleted = 0',
    [id]
  )
  return res.affectedRows
}

export async function updateProductRecord (id, fields) {
  const map = {
    name: 'name',
    description: 'description',
    price: 'price',
    categoryId: 'category_id',
    stock: 'stock',
    imageUrl: 'image_url'
  }
  const sets = []
  const params = []
  for (const key of Object.keys(fields)) {
    if (fields[key] === undefined) continue
    if (!map[key]) continue
    sets.push(`${map[key]} = ?`)
    params.push(fields[key])
  }
  if (!sets.length) return 0
  const sql = `UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ? AND is_deleted = 0`
  params.push(id)
  const res = await query(sql, params)
  return res.affectedRows
}

export async function findProducts (filters) {
  let base = 'FROM products p WHERE p.is_deleted = 0'
  const params = []
  if (filters.q) {
    base += ' AND (p.name LIKE ? OR p.description LIKE ?)'
    params.push(`%${filters.q}%`, `%${filters.q}%`)
  }
  if (filters.categoryId) {
    base += ' AND p.category_id = ?'
    params.push(filters.categoryId)
  }
  if (filters.priceMin != null) {
    base += ' AND p.price >= ?'
    params.push(filters.priceMin)
  }
  if (filters.priceMax != null) {
    base += ' AND p.price <= ?'
    params.push(filters.priceMax)
  }
  let order = ' ORDER BY p.created_at DESC'
  switch (filters.sort) {
    case 'created_asc':
      order = ' ORDER BY p.created_at ASC'
      break
    case 'price_asc':
      order = ' ORDER BY p.price ASC'
      break
    case 'price_desc':
      order = ' ORDER BY p.price DESC'
      break
    case 'name_asc':
      order = ' ORDER BY p.name ASC'
      break
    case 'name_desc':
      order = ' ORDER BY p.name DESC'
      break
  }
  const countQuery = `SELECT COUNT(*) as total ${base}`
  const rowsQuery = `SELECT p.id, p.name, p.price, p.image_url, p.stock, p.created_at ${base}${order} LIMIT ? OFFSET ?`
  const totalRows = await query(countQuery, params)
  const total = totalRows[0]?.total || 0
  const items = await query(rowsQuery, [
    ...params,
    filters.limit,
    (filters.page - 1) * filters.limit
  ])
  return { total, items }
}
