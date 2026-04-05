import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/register  (ADMIN only)
router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  authController.register
);

// GET /api/auth/me
router.get('/me', authenticate, authController.me);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

export default router;
