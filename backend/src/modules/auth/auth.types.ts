import type { UserRole } from '@prisma/client';

export type JwtUserPayload = {
  sub: string;
  role: UserRole;
  restaurantId: string;
  email: string;
  staffCode: string | null;
  sessionId: string;
};

export type AuthenticatedUser = JwtUserPayload & {
  name: string;
  isActive: boolean;
  userAgent?: string | null;
  ipAddress?: string | null;
};
