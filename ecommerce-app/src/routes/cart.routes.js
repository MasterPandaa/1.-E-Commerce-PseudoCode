import { Router } from 'express';
import * as cartController from '../controllers/cart.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { body, param } from 'express-validator';

const router = Router();

// PSEUDO: Add Item to Cart
router.post(
  '/items',
  authMiddleware,
  validate([
    body('productId').isInt({ min: 1 }),
    body('quantity').isInt({ min: 1, max: 999 }),
  ]),
  cartController.addItem
);

// PSEUDO: Update Item Quantity
router.put(
  '/items/:productId',
  authMiddleware,
  validate([
    param('productId').isInt({ min: 1 }),
    body('quantity').isInt({ min: 1, max: 999 }),
  ]),
  cartController.updateItem
);

// PSEUDO: Remove Item
router.delete(
  '/items/:productId',
  authMiddleware,
  validate([param('productId').isInt({ min: 1 })]),
  cartController.removeItem
);

// PSEUDO: Get Cart
router.get('/', authMiddleware, cartController.getCart);

// PSEUDO: Clear Cart
router.delete('/', authMiddleware, cartController.clearCart);

// PSEUDO: Merge guest cart
router.post(
  '/merge',
  authMiddleware,
  validate([
    body('items').isArray({ max: 100 }),
    body('items.*.productId').isInt({ min: 1 }),
    body('items.*.quantity').isInt({ min: 1, max: 999 }),
  ]),
  cartController.mergeCart
);

export default router;
