import type { UserRole } from '@repo/shared-types';

export type AuthUser = {
  id: string;
  name: string;
  staffCode: string | null;
  role: UserRole;
  restaurantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
