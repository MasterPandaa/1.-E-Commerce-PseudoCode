import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.js';
import { body, query } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// PSEUDO: API ENDPOINT - POST /api/auth/register
router.post(
  '/register',
  validate([
    body('email').isEmail().withMessage('Invalid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password too short')
      .matches(/[a-z]/)
      .withMessage('Password must contain lowercase')
      .matches(/[A-Z]/)
      .withMessage('Password must contain uppercase')
      .matches(/\d/)
      .withMessage('Password must contain digit'),
    body('name').isLength({ min: 2, max: 50 }).withMessage('Name 2-50 chars'),
  ]),
  authController.register
);

// PSEUDO: API ENDPOINT - POST /api/auth/login
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 1 }).withMessage('Password required'),
  ]),
  authController.login
);

// PSEUDO: API ENDPOINT - POST /api/auth/password-reset/request
router.post(
  '/password-reset/request',
  validate([body('email').isEmail().withMessage('Invalid email')]),
  authController.requestPasswordReset
);

// PSEUDO: API ENDPOINT - GET /api/auth/password-reset/verify
router.get(
  '/password-reset/verify',
  validate([query('token').isLength({ min: 10 }).withMessage('Invalid token')]),
  authController.verifyPasswordReset
);

// PSEUDO: API ENDPOINT - POST /api/auth/password-reset/confirm
router.post(
  '/password-reset/confirm',
  validate([
    body('token').isLength({ min: 10 }).withMessage('Invalid token'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password too short')
      .matches(/[a-z]/)
      .withMessage('Password must contain lowercase')
      .matches(/[A-Z]/)
      .withMessage('Password must contain uppercase')
      .matches(/\d/)
      .withMessage('Password must contain digit'),
  ]),
  authController.confirmPasswordReset
);

// PSEUDO: API ENDPOINT - POST /api/auth/logout
router.post('/logout', authMiddleware, authController.logout);

export default router;
