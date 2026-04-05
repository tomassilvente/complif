import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { JwtPayload, LoginResponse, SafeUser } from '../types';

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

export async function login(email: string, password: string): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  } as jwt.SignOptions);

  return { user: toSafeUser(user), accessToken };
}

export async function register(
  email: string,
  password: string,
  role: UserRole,
  firstName?: string,
  lastName?: string
): Promise<SafeUser> {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new AppError(409, 'Email already in use');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
    },
  });

  return toSafeUser(user);
}

export async function getUserById(id: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return toSafeUser(user);
}
