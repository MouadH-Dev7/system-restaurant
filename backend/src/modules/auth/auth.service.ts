import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditLogModule, AuditLogStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditTrailService } from '../logs/audit-trail.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser, JwtUserPayload } from './auth.types';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

const PASSWORD_SALT_ROUNDS = 12;

type SessionMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type SafeUser = {
  id: string;
  name: string;
  staffCode: string | null;
  role: UserRole;
  restaurantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  getStatus() {
    return { status: 'ready' };
  }

  async login(input: LoginDto, metadata: SessionMetadata = {}) {
    const prisma = this.prisma as PrismaService & { userSession: any };
    const staffCode = input.staffCode.trim().toUpperCase();
    const user = await this.prisma.user.findFirst({
      where: { staffCode },
    });

    if (!user || !user.isActive) {
      if (user?.restaurantId) {
        await this.auditTrailService.record({
          actor: {
            restaurantId: user.restaurantId,
            userId: user.id,
            userName: user.name,
            role: user.role,
            staffCode,
          },
          module: AuditLogModule.STAFF,
          action: 'AUTH_LOGIN_FAILED',
          actionType: 'LOGIN_FAILED',
          status: AuditLogStatus.FAILED,
          reason: 'Invalid credentials',
          context: metadata,
          details: {
            attemptedStaffCode: staffCode,
          },
        });
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);
    if (!passwordMatches) {
      await this.auditTrailService.record({
        actor: {
          restaurantId: user.restaurantId,
          userId: user.id,
          userName: user.name,
          role: user.role,
          staffCode: user.staffCode,
        },
        module: AuditLogModule.STAFF,
        action: 'AUTH_LOGIN_FAILED',
        actionType: 'LOGIN_FAILED',
        status: AuditLogStatus.FAILED,
        reason: 'Invalid credentials',
        context: metadata,
        details: {
          attemptedStaffCode: staffCode,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const session = await this.createSession(prisma, user.id, {
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
    const tokens = await this.issueTokens(
      {
        id: user.id,
        email: user.email,
        staffCode: user.staffCode,
        role: user.role,
        restaurantId: user.restaurantId,
        name: user.name,
        isActive: user.isActive,
      },
      session.id,
    );

    await this.auditTrailService.record({
      actor: {
        restaurantId: user.restaurantId,
        userId: user.id,
        userName: user.name,
        role: user.role,
        staffCode: user.staffCode,
        sessionId: session.id,
      },
      module: AuditLogModule.STAFF,
      action: 'AUTH_LOGIN',
      actionType: 'LOGIN',
      entityType: 'USER_SESSION',
      entityId: session.id,
      context: metadata,
      after: {
        sessionId: session.id,
        userId: user.id,
        staffCode: user.staffCode,
      },
    });

    return {
      ...tokens,
      user: this.toSafeUser(user),
    };
  }

  async refresh(refreshToken: string, metadata: SessionMetadata = {}) {
    const prisma = this.prisma as PrismaService & { userSession: any };
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await prisma.userSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (!session || !session.user.isActive) {
      throw new UnauthorizedException('Refresh session is invalid');
    }

    const tokenMatches = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!tokenMatches) {
      await prisma.userSession.update({
        where: { id: payload.sessionId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const tokens = await this.issueTokens(
      {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        staffCode: session.user.staffCode,
        role: session.user.role,
        restaurantId: session.user.restaurantId,
        isActive: session.user.isActive,
      },
      session.id,
      {
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    );

    return {
      ...tokens,
      user: this.toSafeUser(session.user),
    };
  }

  async logout(
    currentUser: AuthenticatedUser | undefined,
    refreshToken?: string,
  ) {
    const prisma = this.prisma as PrismaService & { userSession: any };
    if (refreshToken) {
      const payload = await this.verifyRefreshToken(refreshToken);
      await prisma.userSession.updateMany({
        where: {
          id: payload.sessionId,
          userId: payload.sub,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return { success: true };
    }

    if (!currentUser?.sessionId || !currentUser?.sub) {
      throw new BadRequestException('A valid session context is required');
    }

    await prisma.userSession.updateMany({
      where: {
        id: currentUser.sessionId,
        userId: currentUser.sub,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await this.auditTrailService.record({
      actor: {
        restaurantId: currentUser.restaurantId,
        userId: currentUser.sub,
        userName: currentUser.name,
        role: currentUser.role,
        staffCode: currentUser.staffCode,
        sessionId: currentUser.sessionId,
      },
      module: AuditLogModule.STAFF,
      action: 'AUTH_LOGOUT',
      actionType: 'LOGOUT',
      entityType: 'USER_SESSION',
      entityId: currentUser.sessionId,
      context: {
        ipAddress: currentUser.ipAddress,
        userAgent: currentUser.userAgent,
      },
    });

    return { success: true };
  }

  async changePassword(currentUser: AuthenticatedUser, input: ChangePasswordDto) {
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException('New password must be different');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: currentUser.sub,
        restaurantId: currentUser.restaurantId,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const passwordMatches = await bcrypt.compare(input.currentPassword, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await this.hashPassword(input.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      (this.prisma as PrismaService & { userSession: any }).userSession.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
          id: { not: currentUser.sessionId },
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    return { success: true };
  }

  async hashPassword(password: string) {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  }

  private async createSession(
    prisma: PrismaService & { userSession: any },
    userId: string,
    metadata: SessionMetadata = {},
  ) {
    const expiresAt = this.resolveExpiryDate(
      this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    );

    return prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash: '',
        expiresAt,
        ipAddress: metadata.ipAddress?.trim() || null,
        userAgent: metadata.userAgent?.trim() || null,
      },
    });
  }

  private async issueTokens(
    user: {
      id: string;
      name: string;
      email: string;
      staffCode: string | null;
      role: UserRole;
      restaurantId: string;
      isActive: boolean;
    },
    sessionId: string,
    metadata: SessionMetadata = {},
  ) {
    const prisma = this.prisma as PrismaService & { userSession: any };
    const payload: JwtUserPayload = {
      sub: user.id,
      role: user.role,
      restaurantId: user.restaurantId,
      email: user.email,
      staffCode: user.staffCode,
      sessionId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.parseDurationToSeconds(
        this.configService.getOrThrow<string>('JWT_EXPIRES_IN'),
      ),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.parseDurationToSeconds(
        this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
      ),
    });

    await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: await bcrypt.hash(refreshToken, PASSWORD_SALT_ROUNDS),
        expiresAt: this.resolveExpiryDate(
          this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
        ),
        revokedAt: null,
        lastUsedAt: new Date(),
        ipAddress: metadata.ipAddress?.trim() || undefined,
        userAgent: metadata.userAgent?.trim() || undefined,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtUserPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtUserPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      this.logger.error(`Refresh token verification failed: ${(error as Error).message}`, (error as Error).stack);
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
  }

  private resolveExpiryDate(value: string) {
    return new Date(Date.now() + this.parseDurationToSeconds(value) * 1000);
  }

  private parseDurationToSeconds(value: string) {
    const trimmed = value.trim();
    const match = /^(\d+)([smhd])$/.exec(trimmed);

    if (!match) {
      const seconds = Number(trimmed);
      if (Number.isFinite(seconds) && seconds > 0) {
        return seconds;
      }

      throw new Error(`Unsupported expiry format: ${value}`);
    }

    const amount = Number(match[1]);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';
    const multipliers: Record<'s' | 'm' | 'h' | 'd', number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return amount * multipliers[unit];
  }

  private toSafeUser(user: {
    id: string;
    name: string;
    staffCode: string | null;
    role: UserRole;
    restaurantId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      name: user.name,
      staffCode: user.staffCode,
      role: user.role,
      restaurantId: user.restaurantId,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
