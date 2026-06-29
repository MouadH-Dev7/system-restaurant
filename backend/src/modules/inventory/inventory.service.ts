import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type {
  CreateInventoryItemInput,
  InventoryItemDTO,
  SupplyLogDTO,
  UpdateInventoryItemInput,
} from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

function resolveStatus(stockLevel: number, minAlertLevel: number): InventoryItemDTO['status'] {
  if (stockLevel <= minAlertLevel * 0.5) {
    return 'CRITICAL';
  }
  if (stockLevel <= minAlertLevel) {
    return 'LOW_STOCK';
  }
  return 'HEALTHY';
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(restaurantId: string): Promise<InventoryItemDTO[]> {
    try {
      const items = await this.prisma.inventoryItem.findMany({
        where: { restaurantId },
        include: { supplier: true },
        orderBy: { name: 'asc' },
      });
      return items.map((item) => this.toDto(item));
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to list inventory items');
    }
  }

  async create(input: CreateInventoryItemInput): Promise<InventoryItemDTO> {
    try {
      const item = await this.prisma.inventoryItem.create({
        data: {
          restaurantId: input.restaurantId,
          name: input.name,
          unit: input.unit,
          stockLevel: input.stockLevel,
          minAlertLevel: input.minAlertLevel,
          unitPrice: input.unitPrice,
          supplierId: input.supplierId ?? null,
          status: resolveStatus(input.stockLevel, input.minAlertLevel),
        },
        include: { supplier: true },
      });

      await this.prisma.supplyLog.create({
        data: {
          inventoryItemId: item.id,
          supplierId: input.supplierId ?? null,
          quantityAdded: input.stockLevel,
          unitPrice: input.unitPrice,
        },
      });

      return this.toDto(item);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to create inventory item');
    }
  }

  async update(
    id: string,
    restaurantId: string,
    input: UpdateInventoryItemInput,
  ): Promise<InventoryItemDTO> {
    try {
      const current = await this.prisma.inventoryItem.findFirst({
        where: { id, restaurantId },
      });

      if (!current) {
        throw new NotFoundException('Inventory item not found');
      }
      const stockLevel = input.stockLevel ?? current.stockLevel;
      const minAlertLevel = input.minAlertLevel ?? current.minAlertLevel;

      const item = await this.prisma.inventoryItem.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.unit !== undefined && { unit: input.unit }),
          ...(input.stockLevel !== undefined && { stockLevel: input.stockLevel }),
          ...(input.minAlertLevel !== undefined && { minAlertLevel: input.minAlertLevel }),
          ...(input.unitPrice !== undefined && { unitPrice: input.unitPrice }),
          ...(input.supplierId !== undefined && { supplierId: input.supplierId ?? null }),
          status: resolveStatus(stockLevel, minAlertLevel),
        },
        include: { supplier: true },
      });

      if (input.stockLevel !== undefined && input.stockLevel > current.stockLevel) {
        await this.prisma.supplyLog.create({
          data: {
            inventoryItemId: id,
            supplierId: input.supplierId ?? current.supplierId,
            quantityAdded: input.stockLevel - current.stockLevel,
            unitPrice: input.unitPrice ?? Number(current.unitPrice),
          },
        });
      }

      return this.toDto(item);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to update inventory item');
    }
  }

  async remove(id: string, restaurantId: string): Promise<void> {
    try {
      const current = await this.prisma.inventoryItem.findFirst({
        where: { id, restaurantId },
      });

      if (!current) {
        throw new NotFoundException('Inventory item not found');
      }

      await this.prisma.supplyLog.deleteMany({ where: { inventoryItemId: id } });
      await this.prisma.inventoryItem.delete({ where: { id } });
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to delete inventory item');
    }
  }

  async listSupplyLogs(restaurantId: string): Promise<SupplyLogDTO[]> {
    try {
      const logs = await this.prisma.supplyLog.findMany({
        where: { inventoryItem: { restaurantId } },
        include: {
          inventoryItem: { select: { name: true } },
          supplier: { select: { name: true } },
        },
        orderBy: { receivedAt: 'desc' },
        take: 300,
      });

      return logs.map((log) => ({
        id: log.id,
        inventoryItemId: log.inventoryItemId,
        inventoryItemName: log.inventoryItem.name,
        supplierId: log.supplierId,
        supplierName: log.supplier?.name ?? null,
        quantityAdded: log.quantityAdded,
        unitPrice: Number(log.unitPrice),
        receivedAt: log.receivedAt.toISOString(),
      }));
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to list supply logs');
    }
  }

  private toDto(item: {
    id: string;
    restaurantId: string;
    name: string;
    unit: InventoryItemDTO['unit'];
    stockLevel: number;
    minAlertLevel: number;
    unitPrice: number | { toNumber(): number };
    supplierId: string | null;
    supplier: { name: string } | null;
    status: InventoryItemDTO['status'];
    createdAt: Date;
    updatedAt: Date;
  }): InventoryItemDTO {
    return {
      id: item.id,
      restaurantId: item.restaurantId,
      name: item.name,
      unit: item.unit,
      stockLevel: item.stockLevel,
      minAlertLevel: item.minAlertLevel,
      unitPrice: Number(item.unitPrice),
      supplierId: item.supplierId,
      supplierName: item.supplier?.name ?? null,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
