import { UserRole } from '@prisma/client';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

jest.mock('../src/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// Mock de bcrypt con comportamiento conocido
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock de jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
}));

import bcrypt from 'bcryptjs';
import * as authService from '../src/services/auth.service';
import { AppError } from '../src/middleware/errorHandler';

const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;

const MOCK_USER = {
  id: 'user-uuid-1',
  email: 'admin@complif.com',
  passwordHash: '$2b$10$hashedpassword',
  role: UserRole.ADMIN,
  firstName: 'Admin',
  lastName: 'Complif',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('authService.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRATION = '7d';
  });

  it('retorna usuario y accessToken para credenciales válidas', async () => {
    mockFindUnique.mockResolvedValue(MOCK_USER);
    mockBcryptCompare.mockResolvedValue(true);

    const result = await authService.login('admin@complif.com', 'Admin123!');

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('accessToken');
    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.email).toBe('admin@complif.com');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('lanza 401 por contraseña incorrecta', async () => {
    mockFindUnique.mockResolvedValue(MOCK_USER);
    mockBcryptCompare.mockResolvedValue(false);

    await expect(authService.login('admin@complif.com', 'wrongpassword')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid credentials',
    });
  });

  it('lanza 401 para usuario inexistente', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(authService.login('nobody@complif.com', 'password')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid credentials',
    });
  });

  it('no llama a bcrypt cuando el usuario no existe', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(authService.login('nonexistent@complif.com', 'pass')).rejects.toThrow(AppError);

    expect(mockBcryptCompare).not.toHaveBeenCalled();
  });

  it('retorna usuario sin campos sensibles', async () => {
    mockFindUnique.mockResolvedValue(MOCK_USER);
    mockBcryptCompare.mockResolvedValue(true);

    const result = await authService.login('admin@complif.com', 'Admin123!');

    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.user.id).toBe(MOCK_USER.id);
    expect(result.user.role).toBe(UserRole.ADMIN);
  });
});

describe('authService.register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('crea y retorna un nuevo usuario sin passwordHash', async () => {
    mockFindUnique.mockResolvedValue(null); // email disponible
    mockBcryptHash.mockResolvedValue('$2b$10$newhash');
    mockCreate.mockResolvedValue({
      ...MOCK_USER,
      id: 'new-uuid',
      email: 'newuser@complif.com',
      passwordHash: '$2b$10$newhash',
      role: UserRole.VIEWER,
    });

    const user = await authService.register(
      'newuser@complif.com',
      'Password123!',
      UserRole.VIEWER,
      'New',
      'User'
    );

    expect(user.email).toBe('newuser@complif.com');
    expect(user).not.toHaveProperty('passwordHash');
    expect(mockBcryptHash).toHaveBeenCalledWith('Password123!', 10);
  });

  it('lanza 409 cuando el email ya está en uso', async () => {
    mockFindUnique.mockResolvedValue(MOCK_USER);

    await expect(
      authService.register('admin@complif.com', 'Password123!', UserRole.VIEWER)
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Email already in use',
    });

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('hashea la contraseña antes de guardarla', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue('$2b$10$hashedvalue');
    mockCreate.mockResolvedValue({
      ...MOCK_USER,
      email: 'another@complif.com',
      passwordHash: '$2b$10$hashedvalue',
    });

    await authService.register('another@complif.com', 'Plain123!', UserRole.VIEWER);

    expect(mockBcryptHash).toHaveBeenCalledWith('Plain123!', 10);
    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall.data.passwordHash).toBe('$2b$10$hashedvalue');
    expect(createCall.data).not.toHaveProperty('password');
  });
});

describe('authService.getUserById', () => {
  it('retorna usuario seguro para un id válido', async () => {
    mockFindUnique.mockResolvedValue(MOCK_USER);

    const user = await authService.getUserById(MOCK_USER.id);

    expect(user.id).toBe(MOCK_USER.id);
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('lanza 404 para id desconocido', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(authService.getUserById('unknown-id')).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found',
    });
  });
});
