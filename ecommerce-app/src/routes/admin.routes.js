import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import * as adminController from '../controllers/admin.controller.js';
import { validate } from '../middleware/validation.js';
import { body, query, param } from 'express-validator';

const router = Router();

// PSEUDO: Sales stats
router.get(
  '/stats/sales',
  authMiddleware,
  requireRole('admin'),
  validate([
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month']),
  ]),
  adminController.getSalesStats
);

// PSEUDO: Order list
router.get(
  '/orders',
  authMiddleware,
  requireRole('admin'),
  adminController.getOrders
);

// PSEUDO: Update order status
router.patch(
  '/orders/:id/status',
  authMiddleware,
  requireRole('admin'),
  validate([
    param('id').isInt({ min: 1 }),
    body('status').isIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
  ]),
  adminController.updateOrderStatus
);

// PSEUDO: User list
router.get(
  '/users',
  authMiddleware,
  requireRole('admin'),
  adminController.getUsers
);

// PSEUDO: Change user status
router.patch(
  '/users/:id/status',
  authMiddleware,
  requireRole('admin'),
  validate([
    param('id').isInt({ min: 1 }),
    body('status').isIn(['active', 'suspended']),
  ]),
  adminController.changeUserStatus
);

// PSEUDO: Low stock products
router.get(
  '/products/low-stock',
  authMiddleware,
  requireRole('admin'),
  adminController.lowStockProducts
);

export default router;
