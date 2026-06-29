import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { InventoryConsumptionLogDTO } from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

type ConsumptionLogFilters = {
  restaurantId: string;
  inventoryItemId?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  orderType?: string;
  dailyOrderNumber?: number;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 300;
const MAX_PAGE_SIZE = 500;

@Injectable()
export class InventoryConsumptionLogsService {
  private readonly logger = new Logger(InventoryConsumptionLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(filters: ConsumptionLogFilters): Promise<InventoryConsumptionLogDTO[]> {
    const where: Prisma.InventoryConsumptionLogWhereInput = {
      restaurantId: filters.restaurantId,
    };

    if (filters.inventoryItemId) {
      where.inventoryItemId = filters.inventoryItemId;
    }

    if (filters.type) {
      where.type = filters.type as any;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        if (filters.endDate.length <= 10) {
          endDate.setUTCHours(23, 59, 59, 999);
        }
        where.createdAt.lte = endDate;
      }
    }

    if (filters.orderType || filters.dailyOrderNumber) {
      where.order = {};
      if (filters.orderType) {
        where.order.orderType = filters.orderType as any;
      }
      if (filters.dailyOrderNumber) {
        where.order.dailyOrderNumber = filters.dailyOrderNumber;
      }
    }

    const page = Math.max(filters.page ?? 1, 1);
    const pageSize = Math.min(filters.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    try {
      const logs = await this.prisma.inventoryConsumptionLog.findMany({
        where,
        include: {
          inventoryItem: { select: { name: true, unit: true } },
          order: {
            select: {
              dailyOrderNumber: true,
              orderType: true,
              table: { select: { number: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return logs.map((log) => ({
        id: log.id,
        restaurantId: log.restaurantId,
        inventoryItemId: log.inventoryItemId,
        inventoryItemName: log.inventoryItem?.name ?? 'Deleted Item',
        unit: (log.inventoryItem?.unit as InventoryConsumptionLogDTO['unit']) ?? null,
        orderId: log.orderId,
        dailyOrderNumber: log.order?.dailyOrderNumber ?? null,
        orderType: (log.order?.orderType ?? null) as InventoryConsumptionLogDTO['orderType'],
        tableName: log.order?.table ? String(log.order.table.number) : null,
        quantityUsed: log.quantityUsed,
        type: (log.type ?? 'AUTO_DEDUCTION') as InventoryConsumptionLogDTO['type'],
        createdAt: log.createdAt?.toISOString() ?? new Date().toISOString(),
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch consumption logs: ${(error as Error).message}`, (error as Error).stack);
      return [];
    }
  }
}
