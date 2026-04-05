import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { SafeUser } from '../types';

const SALT_ROUNDS = 10;

function toSafeUser(user: {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function listUsers(): Promise<SafeUser[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return users.map(toSafeUser);
}

export async function getUserById(id: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return toSafeUser(user);
}

export async function updateUser(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: UserRole;
  }
): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Verificar unicidad del email si se está cambiando
  if (data.email && data.email !== user.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailTaken) {
      throw new AppError(409, 'Email already in use');
    }
  }

  const updateData: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string;
    passwordHash?: string;
    role?: UserRole;
  } = {};

  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.password !== undefined) {
    updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return toSafeUser(updated);
}
