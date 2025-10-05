import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { validate } from '../middleware/validation.js';
import { body, query, param } from 'express-validator';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// PSEUDO: Create Product
router.post(
  '/',
  authMiddleware,
  requireRole('admin'),
  upload.single('image'),
  validate([
    body('name').isLength({ min: 2, max: 150 }),
    body('description').isLength({ min: 10, max: 5000 }),
    body('price').isFloat({ gt: 0 }),
    body('categoryId').isInt({ gt: 0 }),
    body('stock').isInt({ min: 0 }),
  ]),
  productController.createProduct
);

// PSEUDO: Get All Products
router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('q').optional().isString(),
    query('categoryId').optional().isInt({ min: 1 }),
    query('priceMin').optional().isFloat({ min: 0 }),
    query('priceMax').optional().isFloat({ min: 0 }),
    query('sort')
      .optional()
      .isIn(['created_desc', 'created_asc', 'price_asc', 'price_desc', 'name_asc', 'name_desc']),
  ]),
  productController.listProducts
);

// PSEUDO: Get Single Product
router.get(
  '/:id',
  validate([param('id').isInt({ min: 1 })]),
  productController.getProduct
);

// PSEUDO: Update Product
router.put(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  upload.single('image'),
  validate([param('id').isInt({ min: 1 })]),
  productController.updateProduct
);

// PSEUDO: Delete Product
router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  validate([param('id').isInt({ min: 1 })]),
  productController.deleteProduct
);

export default router;
