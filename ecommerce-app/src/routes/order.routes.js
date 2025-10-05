import { Router } from 'express'
import * as orderController from '../controllers/order.controller.js'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import { body, param } from 'express-validator'

const router = Router()

// PSEUDO: Validate Checkout
router.post(
  '/checkout/validate',
  authMiddleware,
  validate([
    body('address').isObject(),
    body('address.name').isString().notEmpty(),
    body('address.line1').isString().notEmpty(),
    body('address.city').isString().notEmpty(),
    body('address.postal').isString().notEmpty(),
    body('address.country').isString().isLength({ min: 2, max: 2 }),
    body('payment').isObject(),
    body('payment.method').isIn(['card', 'cod']),
    body('idempotencyKey').isString().isLength({ min: 10 })
  ]),
  orderController.validateCheckout
)

// PSEUDO: Place Order
router.post(
  '/checkout/place',
  authMiddleware,
  validate([
    body('address').isObject(),
    body('payment').isObject(),
    body('idempotencyKey').isString().isLength({ min: 10 })
  ]),
  orderController.placeOrder
)

// PSEUDO: Get Invoice
router.get(
  '/orders/:id/invoice',
  authMiddleware,
  validate([param('id').isInt({ min: 1 })]),
  orderController.getInvoice
)

export default router
