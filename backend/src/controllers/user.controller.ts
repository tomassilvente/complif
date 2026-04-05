import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import * as userService from '../services/user.service';
import { AppError } from '../middleware/errorHandler';

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export async function listUsers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await userService.listUsers();

    res.json({
      status: 'success',
      data: { users },
    });
  } catch (error) {
    next(error);
  }
}

export async function getUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await userService.getUserById(req.params.id);

    res.json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Not authenticated');

    const targetId = req.params.id;

    // Solo ADMIN puede actualizar perfiles de otros usuarios o cambiar roles
    const isSelf = req.user.id === targetId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isSelf && !isAdmin) {
      throw new AppError(403, 'Insufficient permissions');
    }

    const body = updateUserSchema.parse(req.body);

    // Los no-admins no pueden cambiar su propio rol
    if (!isAdmin && body.role !== undefined) {
      throw new AppError(403, 'Only admins can change roles');
    }

    const user = await userService.updateUser(targetId, body);

    res.json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
