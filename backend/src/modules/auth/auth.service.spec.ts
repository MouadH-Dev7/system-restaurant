import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const now = new Date('2026-06-08T10:00:00.000Z');
  const user = {
    id: 'u1',
    name: 'Admin Demo',
    email: 'admin@demo.local',
    staffCode: 'ADM001',
    password: '$2b$12$Y6wfvLQmZf3pQ6ln8I8Q4uD0Z8A2nP1vM6lBvS7Q3Q2o2yKrS05j6',
    role: UserRole.ADMIN,
    restaurantId: 'r1',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(async (operations: unknown[]) => Promise.all(operations as Promise<unknown>[])),
  } as any;

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const env: Record<string, string> = {
        JWT_SECRET: '12345678901234567890123456789012',
        JWT_REFRESH_SECRET: 'abcdefghijklmnopqrstuvwxyz123456',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '30d',
      };

      return env[key];
    }),
  } as any;

  const auditTrailService = {
    record: jest.fn(),
  } as any;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma, jwtService, configService, auditTrailService);
  });

  it('rejects invalid credentials', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.login({ staffCode: 'missing', password: 'wrongpass123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates access and refresh tokens for valid login', async () => {
    prisma.user.findFirst.mockResolvedValue({
      ...user,
      password: await service.hashPassword('Admin12345!'),
    });
    prisma.userSession.create.mockResolvedValue({ id: 'session-1' });
    prisma.userSession.update.mockResolvedValue(undefined);
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login({
      staffCode: user.staffCode,
      password: 'Admin12345!',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.staffCode).toBe(user.staffCode);
    expect(prisma.userSession.create).toHaveBeenCalled();
    expect(auditTrailService.record).toHaveBeenCalled();
  });

  it('refreshes tokens for a valid session', async () => {
    const hashedRefresh = await service.hashPassword('refresh-token');

    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: user.id,
      role: user.role,
      restaurantId: user.restaurantId,
      email: user.email,
      staffCode: user.staffCode,
      sessionId: 'session-1',
    });
    prisma.userSession.findFirst.mockResolvedValue({
      id: 'session-1',
      refreshTokenHash: hashedRefresh,
      user,
    });
    prisma.userSession.update.mockResolvedValue(undefined);
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    const result = await service.refresh('refresh-token');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(prisma.userSession.findFirst).toHaveBeenCalled();
  });

  it('changes password and revokes other sessions', async () => {
    const existingPassword = await service.hashPassword('Admin12345!');
    prisma.user.findFirst.mockResolvedValue({
      ...user,
      password: existingPassword,
    });
    prisma.user.update.mockResolvedValue(undefined);
    prisma.userSession.updateMany.mockResolvedValue(undefined);

    const result = await service.changePassword(
      {
        sub: user.id,
        sessionId: 'session-1',
        name: user.name,
        email: user.email,
        staffCode: user.staffCode,
        role: user.role,
        restaurantId: user.restaurantId,
        isActive: true,
      },
      {
        currentPassword: 'Admin12345!',
        newPassword: 'NewPassword123!',
      },
    );

    expect(result).toEqual({ success: true });
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.userSession.updateMany).toHaveBeenCalled();
  });
});
