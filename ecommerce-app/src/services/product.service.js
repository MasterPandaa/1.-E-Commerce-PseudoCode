// PSEUDO: Product service implementing create, list, get, update, delete
import sanitizeHtml from 'sanitize-html';
import { isValidImageMagicBytes } from '../utils/image.js';
import { generateSafeFilename, productsUploadDir, saveBufferToFile } from '../utils/storage.js';
import {
  getCategoryById,
  createProductRecord,
  getProductById,
  updateProductRecord,
  softDeleteProduct,
  findProducts,
} from '../models/product.model.js';

function sanitizeDescription(html) {
  return sanitizeHtml(html || '', {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'img']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt'],
      '*': ['style'],
    },
    allowedSchemes: ['http', 'https', 'data'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  });
}

function normalizeListQuery(q) {
  const page = Math.max(parseInt(q.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(q.limit || '20', 10), 1), 100);
  const out = {
    page,
    limit,
    q: q.q ? String(q.q) : '',
    categoryId: q.categoryId ? parseInt(q.categoryId, 10) : null,
    priceMin: q.priceMin != null ? parseFloat(q.priceMin) : null,
    priceMax: q.priceMax != null ? parseFloat(q.priceMax) : null,
    sort: q.sort || 'created_desc',
  };
  if (out.priceMin != null && out.priceMin < 0) out.priceMin = 0;
  if (out.priceMax != null && out.priceMax < 0) out.priceMax = 0;
  if (out.priceMin != null && out.priceMax != null && out.priceMin > out.priceMax) {
    // swap to be safe
    const t = out.priceMin;
    out.priceMin = out.priceMax;
    out.priceMax = t;
  }
  return out;
}

export async function create(data, imageFile, currentUser) {
  // PSEUDO: createProduct
  if (!currentUser || currentUser.role !== 'admin') {
    return { type: 'auth_error', message: 'Forbidden' };
  }
  const name = String(data.name || '').trim();
  const description = sanitizeDescription(data.description || '');
  const price = parseFloat(data.price);
  const categoryId = parseInt(data.categoryId, 10);
  const stock = parseInt(data.stock, 10);
  if (!name || name.length < 2 || name.length > 150) return { type: 'validation_error', message: 'Invalid name' };
  if (!description || description.length < 10) return { type: 'validation_error', message: 'Invalid description' };
  if (!Number.isFinite(price) || price <= 0) return { type: 'validation_error', message: 'Invalid price' };
  if (!Number.isInteger(categoryId) || categoryId <= 0) return { type: 'validation_error', message: 'Invalid category' };
  if (!Number.isInteger(stock) || stock < 0) return { type: 'validation_error', message: 'Invalid stock' };

  const cat = await getCategoryById(categoryId);
  if (!cat) return { type: 'validation_error', message: 'Category not found' };

  if (!imageFile || !imageFile.buffer) {
    return { type: 'validation_error', message: 'Image required' };
  }
  const isValidMagic = await isValidImageMagicBytes(imageFile.buffer);
  if (!isValidMagic) return { type: 'validation_error', message: 'Invalid image file' };

  const filename = generateSafeFilename(imageFile.originalname, imageFile.mimetype);
  const destDir = productsUploadDir();
  const saved = await saveBufferToFile(imageFile.buffer, destDir, filename);

  const id = await createProductRecord({ name, description, price, categoryId, stock, imageUrl: saved.url });
  return { type: 'success', data: { id, name, description, price, categoryId, stock, imageUrl: saved.url } };
}

export async function list(query) {
  const filters = normalizeListQuery(query);
  const data = await findProducts(filters);
  return { type: 'success', data: { ...data, page: filters.page, limit: filters.limit } };
}

export async function get(id) {
  const pid = parseInt(id, 10);
  if (!Number.isInteger(pid) || pid <= 0) return { type: 'validation_error', message: 'Invalid ID' };
  const p = await getProductById(pid);
  if (!p) return { type: 'not_found', message: 'Product not found' };
  return { type: 'success', data: p };
}

export async function update(id, data, imageFile, currentUser) {
  if (!currentUser || currentUser.role !== 'admin') {
    return { type: 'auth_error', message: 'Forbidden' };
  }
  const pid = parseInt(id, 10);
  if (!Number.isInteger(pid) || pid <= 0) return { type: 'validation_error', message: 'Invalid ID' };

  const fields = {};
  if (data.name) {
    const name = String(data.name).trim();
    if (name.length < 2 || name.length > 150) return { type: 'validation_error', message: 'Invalid name' };
    fields.name = name;
  }
  if (data.description) {
    const desc = sanitizeDescription(data.description);
    if (desc.length < 10) return { type: 'validation_error', message: 'Invalid description' };
    fields.description = desc;
  }
  if (data.price != null) {
    const price = parseFloat(data.price);
    if (!Number.isFinite(price) || price <= 0) return { type: 'validation_error', message: 'Invalid price' };
    fields.price = price;
  }
  if (data.categoryId != null) {
    const categoryId = parseInt(data.categoryId, 10);
    if (!Number.isInteger(categoryId) || categoryId <= 0) return { type: 'validation_error', message: 'Invalid category' };
    const cat = await getCategoryById(categoryId);
    if (!cat) return { type: 'validation_error', message: 'Category not found' };
    fields.categoryId = categoryId;
  }
  if (data.stock != null) {
    const stock = parseInt(data.stock, 10);
    if (!Number.isInteger(stock) || stock < 0) return { type: 'validation_error', message: 'Invalid stock' };
    fields.stock = stock;
  }

  if (imageFile && imageFile.buffer) {
    const isValidMagic = await isValidImageMagicBytes(imageFile.buffer);
    if (!isValidMagic) return { type: 'validation_error', message: 'Invalid image file' };
    const filename = generateSafeFilename(imageFile.originalname, imageFile.mimetype);
    const destDir = productsUploadDir();
    const saved = await saveBufferToFile(imageFile.buffer, destDir, filename);
    fields.imageUrl = saved.url;
  }

  const affected = await updateProductRecord(pid, fields);
  if (affected === 0) return { type: 'not_found', message: 'Product not found' };
  return { type: 'success', message: 'Updated' };
}

export async function remove(id, currentUser) {
  if (!currentUser || currentUser.role !== 'admin') {
    return { type: 'auth_error', message: 'Forbidden' };
  }
  const pid = parseInt(id, 10);
  if (!Number.isInteger(pid) || pid <= 0) return { type: 'validation_error', message: 'Invalid ID' };
  const affected = await softDeleteProduct(pid);
  if (affected === 0) return { type: 'not_found', message: 'Product not found' };
  return { type: 'success', message: 'Deleted' };
}
