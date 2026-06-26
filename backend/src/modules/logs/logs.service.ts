import { Injectable } from '@nestjs/common';
import type { AuditLogDTO, EmployeeRiskProfileDTO } from '@repo/shared-types';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ListLogsQueryDto } from './dto/list-logs-query.dto';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(restaurantId: string, query: ListLogsQueryDto = {}): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {
      restaurantId,
      ...(query.role ? { role: query.role } : {}),
      ...(query.module ? { module: query.module } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.userName
        ? {
            userName: {
              contains: query.userName.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.action
        ? {
            action: {
              contains: query.action.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    if (query.staffCode?.trim()) {
      where.details = {
        path: ['staffCode'],
        equals: query.staffCode.trim().toUpperCase(),
      };
    }

    if (query.orderNumber !== undefined) {
      where.OR = [
        {
          details: {
            path: ['dailyOrderNumber'],
            equals: query.orderNumber,
          },
        },
        {
          action: {
            contains: String(query.orderNumber),
          },
        },
      ];
    }

    return where;
  }

  async list(restaurantId: string, query: ListLogsQueryDto = {}): Promise<AuditLogDTO[]> {
    const where = this.buildWhere(restaurantId, query);

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    return logs.map((log) => ({
      id: log.id,
      restaurantId: log.restaurantId,
      userId: log.userId,
      userName: log.userName,
      role: log.role,
      action: log.action,
      details: log.details,
      module: log.module,
      status: log.status,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  async getEmployeeRiskProfiles(
    restaurantId: string,
    query: ListLogsQueryDto = {},
  ): Promise<EmployeeRiskProfileDTO[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: this.buildWhere(restaurantId, query),
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const profiles = new Map<string, EmployeeRiskProfileDTO>();

    for (const log of logs) {
      const details = (log.details ?? {}) as Record<string, unknown>;
      const staffCode =
        typeof details.staffCode === 'string' ? details.staffCode : null;
      const key = `${log.userName}:${log.role}:${staffCode ?? ''}`;
      const current = profiles.get(key) ?? {
        userName: log.userName,
        role: log.role,
        staffCode,
        editsCount: 0,
        cancellationsCount: 0,
        discountsCount: 0,
        refundsCount: 0,
        affectedAmount: 0,
        riskScore: 0,
        highRiskActions: 0,
      };

      if (log.action.includes('UPDATE_ORDER') || log.action.includes('ORDER_ITEMS_UPDATED')) {
        current.editsCount += 1;
      }
      if (log.action.includes('CANCEL')) {
        current.cancellationsCount += 1;
      }
      if (log.action.includes('DISCOUNT')) {
        current.discountsCount += 1;
      }
      if (log.action.includes('REFUND')) {
        current.refundsCount += 1;
      }

      const flags = Array.isArray(details.riskFlags) ? details.riskFlags : [];
      if (flags.length > 0) {
        current.highRiskActions += 1;
      }

      if (log.action === 'PAYMENT_METHOD_CHANGED') {
        current.highRiskActions += 1;
      }

      const totalDelta =
        typeof details.totalDelta === 'number'
          ? Math.abs(details.totalDelta)
          : typeof details.amountDelta === 'number'
            ? Math.abs(details.amountDelta)
          : 0;
      current.affectedAmount += totalDelta;
      current.riskScore =
        current.highRiskActions * 15 +
        current.cancellationsCount * 10 +
        current.refundsCount * 12 +
        current.discountsCount * 8 +
        current.editsCount * 3 +
        Math.round(current.affectedAmount / 100);

      profiles.set(key, current);
    }

    return Array.from(profiles.values()).sort((a, b) => b.riskScore - a.riskScore);
  }
}
