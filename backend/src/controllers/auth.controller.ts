import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import * as authService from '../services/auth.service';
import { AppError } from '../middleware/errorHandler';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.VIEWER),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);
    const user = await authService.register(
      body.email,
      body.password,
      body.role,
      body.firstName,
      body.lastName
    );

    res.status(201).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const user = await authService.getUserById(req.user.id);

    res.json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({
      status: 'success',
      message: 'Logged out successfully. Please clear your token on the client.',
    });
  } catch (error) {
    next(error);
  }
}
