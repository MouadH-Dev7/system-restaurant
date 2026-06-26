import type { AuditLogModule, AuditLogStatus, UserRole } from '@prisma/client';

export type AuditActor = {
  userId?: string | null;
  userName: string;
  role: UserRole | string;
  restaurantId: string;
  staffCode?: string | null;
  sessionId?: string | null;
};

export type AuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceInfo?: string | null;
};

export type AuditEntryInput = {
  actor: AuditActor;
  module: AuditLogModule;
  action: string;
  status?: AuditLogStatus;
  reason?: string | null;
  actionType?: string;
  entityType?: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  details?: Record<string, unknown>;
  riskFlags?: string[];
  context?: AuditContext;
};
