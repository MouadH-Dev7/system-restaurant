import { Injectable } from '@nestjs/common';
import type { AuditLogDTO, EmployeeRiskProfileDTO, PaginatedResponse } from '@repo/shared-types';
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

  async list(
    restaurantId: string,
    query: ListLogsQueryDto = {},
  ): Promise<PaginatedResponse<AuditLogDTO>> {
    const where = this.buildWhere(restaurantId, query);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 15, 15);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map((log) => ({
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
      })),
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async listDistinctUsers(restaurantId: string): Promise<string[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { restaurantId },
      select: { userName: true },
      distinct: ['userName'],
      orderBy: { userName: 'asc' },
    });
    return rows.map((r) => r.userName);
  }

  async getEmployeeRiskProfiles(
    restaurantId: string,
    query: ListLogsQueryDto = {},
  ): Promise<EmployeeRiskProfileDTO[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    conditions.push(`al."restaurantId" = $${paramIndex++}`);
    params.push(restaurantId);

    if (query.role) {
      conditions.push(`al."role" = $${paramIndex++}`);
      params.push(query.role);
    }
    if (query.module) {
      conditions.push(`al."module" = $${paramIndex++}`);
      params.push(query.module);
    }
    if (query.status) {
      conditions.push(`al."status" = $${paramIndex++}`);
      params.push(query.status);
    }
    if (query.userName?.trim()) {
      conditions.push(`al."userName" ILIKE $${paramIndex++}`);
      params.push(`%${query.userName.trim()}%`);
    }
    if (query.action?.trim()) {
      conditions.push(`al."action" ILIKE $${paramIndex++}`);
      params.push(`%${query.action.trim()}%`);
    }
    if (query.from) {
      conditions.push(`al."createdAt" >= $${paramIndex++}`);
      params.push(new Date(query.from));
    }
    if (query.to) {
      conditions.push(`al."createdAt" <= $${paramIndex++}`);
      params.push(new Date(query.to));
    }
    if (query.staffCode?.trim()) {
      conditions.push(`al."details"->>'staffCode' = $${paramIndex++}`);
      params.push(query.staffCode.trim().toUpperCase());
    }
    if (query.orderNumber !== undefined) {
      conditions.push(`(al."details"->>'dailyOrderNumber' = $${paramIndex} OR CAST(al."action" AS text) ILIKE $${paramIndex + 1})`);
      params.push(String(query.orderNumber), `%${query.orderNumber}%`);
      paramIndex += 2;
    }

    const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{
        userName: string;
        role: string;
        staffCode: string | null;
        editsCount: bigint;
        cancellationsCount: bigint;
        discountsCount: bigint;
        refundsCount: bigint;
        highRiskActions: bigint;
        affectedAmount: number | null;
      }>
    >(
      `
        SELECT
          al."userName",
          al."role",
          al."details"->>'staffCode' AS "staffCode",
          COUNT(*) FILTER (WHERE al."action" IN ('UPDATE_ORDER', 'ORDER_ITEMS_UPDATED'))::int AS "editsCount",
          COUNT(*) FILTER (WHERE al."action" ILIKE '%CANCEL%')::int AS "cancellationsCount",
          COUNT(*) FILTER (WHERE al."action" ILIKE '%DISCOUNT%')::int AS "discountsCount",
          COUNT(*) FILTER (WHERE al."action" ILIKE '%REFUND%')::int AS "refundsCount",
          COUNT(*) FILTER (
            WHERE al."action" = 'PAYMENT_METHOD_CHANGED'
               OR (al."details"::jsonb ? 'riskFlags' AND jsonb_array_length(al."details"->'riskFlags') > 0)
          )::int AS "highRiskActions",
          COALESCE(SUM(
            CASE
              WHEN al."details"->>'totalDelta' ~ '^-?[0-9]+(\.[0-9]+)?$'
                THEN ABS((al."details"->>'totalDelta')::numeric)
              WHEN al."details"->>'amountDelta' ~ '^-?[0-9]+(\.[0-9]+)?$'
                THEN ABS((al."details"->>'amountDelta')::numeric)
              ELSE 0
            END
          ), 0)::numeric AS "affectedAmount"
        FROM "AuditLog" al
        ${whereSQL}
        GROUP BY al."userName", al."role", al."details"->>'staffCode'
        ORDER BY "affectedAmount" DESC
      `,
      ...params,
    );

    return rows.map((row) => {
      const editsCount = Number(row.editsCount);
      const cancellationsCount = Number(row.cancellationsCount);
      const discountsCount = Number(row.discountsCount);
      const refundsCount = Number(row.refundsCount);
      const highRiskActions = Number(row.highRiskActions);
      const affectedAmount = Number(row.affectedAmount ?? 0);

      return {
        userName: row.userName,
        role: row.role,
        staffCode: row.staffCode ?? null,
        editsCount,
        cancellationsCount,
        discountsCount,
        refundsCount,
        affectedAmount,
        highRiskActions,
        riskScore:
          highRiskActions * 15 +
          cancellationsCount * 10 +
          refundsCount * 12 +
          discountsCount * 8 +
          editsCount * 3 +
          Math.round(affectedAmount / 100),
      };
    });
  }
}
