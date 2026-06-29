import { Injectable } from '@nestjs/common';
import { AuditLogStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuditEntryInput } from './audit.types';

@Injectable()
export class AuditTrailService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditEntryInput) {
    const actorRole = String(input.actor.role);
    if (actorRole === UserRole.ADMIN || actorRole === UserRole.MANAGER) {
      return;
    }

    return this.prisma.auditLog.create({
      data: {
        restaurantId: input.actor.restaurantId,
        userId: input.actor.userId ?? null,
        userName: input.actor.userName,
        role: String(input.actor.role),
        action: input.action,
        details: {
          actionType: input.actionType ?? null,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          reason: input.reason ?? null,
          staffCode: input.actor.staffCode ?? null,
          sessionId: input.actor.sessionId ?? null,
          ipAddress: input.context?.ipAddress ?? null,
          userAgent: input.context?.userAgent ?? null,
          deviceInfo: input.context?.deviceInfo ?? input.context?.userAgent ?? null,
          riskFlags: input.riskFlags ?? [],
          before: input.before ?? null,
          after: input.after ?? null,
          ...(input.details ?? {}),
        },
        module: input.module,
        status: input.status ?? AuditLogStatus.SUCCESS,
      },
    });
  }
}
