import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { BusinessStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import * as businessService from '../services/business.service';
import * as notificationService from '../services/notification.service';
import { AppError } from '../middleware/errorHandler';
import { io } from '../index';

const createBusinessSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  taxId: z.string().min(5, 'Tax ID must be at least 5 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  industry: z.string().min(2, 'Industry must be at least 2 characters'),
});

const listBusinessesSchema = z.object({
  status: z.nativeEnum(BusinessStatus).optional(),
  country: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const updateStatusSchema = z.object({
  newStatus: z.nativeEnum(BusinessStatus, {
    errorMap: () => ({ message: 'Invalid status value' }),
  }),
  comment: z.string().optional(),
});

export async function createBusiness(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Not authenticated');

    const body = createBusinessSchema.parse(req.body);
    const business = await businessService.createBusiness(body, req.user.id);

    res.status(201).json({
      status: 'success',
      data: { business },
    });
  } catch (error) {
    next(error);
  }
}

export async function listBusinesses(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = listBusinessesSchema.parse(req.query);
    const result = await businessService.listBusinesses(query);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBusinessById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const business = await businessService.getBusinessById(req.params.id);

    res.json({
      status: 'success',
      data: { business },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Not authenticated');

    const { newStatus, comment } = updateStatusSchema.parse(req.body);
    const previousBusiness = await businessService.getBusinessById(req.params.id);
    const previousStatus = previousBusiness.status;

    const business = await businessService.updateBusinessStatus(
      req.params.id,
      newStatus,
      req.user.id,
      comment
    );

    // Emitir notificación en tiempo real
    notificationService.notifyStatusChange(
      business!.id,
      business!.name,
      previousStatus,
      newStatus,
      io
    );

    res.json({
      status: 'success',
      data: { business },
    });
  } catch (error) {
    next(error);
  }
}

export async function getBusinessRiskScore(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await businessService.getBusinessRiskScore(req.params.id);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
