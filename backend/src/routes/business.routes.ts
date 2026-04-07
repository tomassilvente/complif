import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as businessController from '../controllers/business.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/businesses
router.post('/', businessController.createBusiness);

// GET /api/businesses
router.get('/', businessController.listBusinesses);

// GET /api/businesses/:id
router.get('/:id', businessController.getBusinessById);

// PATCH /api/businesses/:id/status  (solo ADMIN)
router.patch('/:id/status', authorize('ADMIN'), businessController.updateStatus);

// DELETE /api/businesses/:id  (solo ADMIN)
router.delete('/:id', authorize('ADMIN'), businessController.deleteBusiness);

// GET /api/businesses/:id/risk-score
router.get('/:id/risk-score', businessController.getBusinessRiskScore);

export default router;
