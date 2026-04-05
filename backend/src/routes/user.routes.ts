import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users  (ADMIN only)
router.get('/', authorize('ADMIN'), userController.listUsers);

// GET /api/users/:id
router.get('/:id', userController.getUser);

// PATCH /api/users/:id  (own profile or ADMIN)
router.patch('/:id', userController.updateUser);

export default router;
