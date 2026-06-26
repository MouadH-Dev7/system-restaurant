import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateInventoryItemInput,
  InventoryItemDTO,
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
    const items = await this.prisma.inventoryItem.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    });

    return items.map((item) => this.toDto(item));
  }

  async create(input: CreateInventoryItemInput): Promise<InventoryItemDTO> {
    const item = await this.prisma.inventoryItem.create({
      data: {
        ...input,
        status: resolveStatus(input.stockLevel, input.minAlertLevel),
      },
    });

    return this.toDto(item);
  }

  async update(
    id: string,
    restaurantId: string,
    input: UpdateInventoryItemInput,
  ): Promise<InventoryItemDTO> {
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
        ...input,
        status: resolveStatus(stockLevel, minAlertLevel),
      },
    });

    return this.toDto(item);
  }

  private toDto(item: {
    id: string;
    restaurantId: string;
    name: string;
    unit: string;
    stockLevel: number;
    minAlertLevel: number;
    unitPrice: number;
    supplier: string;
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
      unitPrice: item.unitPrice,
      supplier: item.supplier,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
