import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser, JwtUserPayload } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtUserPayload): Promise<AuthenticatedUser> {
    const prisma = this.prisma as PrismaService & { userSession: any };

    if (!payload?.sub || !payload.restaurantId || !payload.email || !payload.sessionId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        email: payload.email,
        restaurantId: payload.restaurantId,
        role: payload.role as UserRole,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        staffCode: true,
        role: true,
        restaurantId: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    const session = await prisma.userSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: user.id,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: { id: true, ipAddress: true, userAgent: true },
    });

    if (!session) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    return {
      sub: user.id,
      sessionId: payload.sessionId,
      name: user.name,
      email: user.email,
      staffCode: user.staffCode,
      role: user.role,
      restaurantId: user.restaurantId,
      isActive: user.isActive,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
    };
  }
}
