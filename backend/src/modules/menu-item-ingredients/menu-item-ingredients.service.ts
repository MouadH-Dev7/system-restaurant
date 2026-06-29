import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  MenuItemIngredientDTO,
  UpdateMenuItemIngredientInput,
} from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemIngredientDto } from './dto/create-menu-item-ingredient.dto';

@Injectable()
export class MenuItemIngredientsService {
  private readonly logger = new Logger(MenuItemIngredientsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByMenuItem(menuItemId: string): Promise<MenuItemIngredientDTO[]> {
    try {
      const ingredients = await this.prisma.menuItemIngredient.findMany({
        where: { menuItemId },
        include: { inventoryItem: { select: { name: true, unit: true } } },
        orderBy: { createdAt: 'asc' },
      });

      return ingredients.map((item) => this.toDto(item));
    } catch (error) {
      this.logger.error(`findByMenuItem failed for menuItemId=${menuItemId}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async create(
    input: CreateMenuItemIngredientDto,
  ): Promise<MenuItemIngredientDTO> {
    try {
      const [menuItem, inventoryItem] = await Promise.all([
        this.prisma.menuItem.findUnique({ where: { id: input.menuItemId }, select: { id: true } }),
        this.prisma.inventoryItem.findUnique({ where: { id: input.inventoryItemId }, select: { id: true, name: true, unit: true } }),
      ]);

      if (!menuItem) {
        throw new NotFoundException('Menu item not found');
      }

      if (!inventoryItem) {
        throw new NotFoundException('Inventory item not found');
      }

      const safeQuantity = Number(input.quantityRequired);
      if (isNaN(safeQuantity)) {
        throw new Error(`Invalid quantityRequired: ${input.quantityRequired}`);
      }

      const ingredient = await this.prisma.menuItemIngredient.create({
        data: {
          menuItemId: input.menuItemId,
          inventoryItemId: input.inventoryItemId,
          quantityRequired: safeQuantity,
        },
        include: { inventoryItem: { select: { name: true, unit: true } } },
      });

      return this.toDto(ingredient);
    } catch (error) {
      this.logger.error(`create failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async update(
    id: string,
    input: UpdateMenuItemIngredientInput,
  ): Promise<MenuItemIngredientDTO> {
    try {
      const existing = await this.prisma.menuItemIngredient.findUnique({
        where: { id },
        include: { inventoryItem: { select: { name: true, unit: true } } },
      });

      if (!existing) {
        throw new NotFoundException('Ingredient not found');
      }

      if (input.inventoryItemId) {
        const inventoryItem = await this.prisma.inventoryItem.findUnique({
          where: { id: input.inventoryItemId },
          select: { id: true, name: true, unit: true },
        });

        if (!inventoryItem) {
          throw new NotFoundException('Inventory item not found');
        }
      }

      const safeQuantity = input.quantityRequired !== undefined ? Number(input.quantityRequired) : undefined;
      if (safeQuantity !== undefined && isNaN(safeQuantity)) {
        throw new Error(`Invalid quantityRequired: ${input.quantityRequired}`);
      }

      const ingredient = await this.prisma.menuItemIngredient.update({
        where: { id },
        data: {
          ...(input.inventoryItemId !== undefined ? { inventoryItemId: input.inventoryItemId } : {}),
          ...(safeQuantity !== undefined ? { quantityRequired: safeQuantity } : {}),
        },
        include: { inventoryItem: { select: { name: true, unit: true } } },
      });

      return this.toDto(ingredient);
    } catch (error) {
      this.logger.error(`update failed for id=${id}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const existing = await this.prisma.menuItemIngredient.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Ingredient not found');
      }

      await this.prisma.menuItemIngredient.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`remove failed for id=${id}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  private toDto(item: {
    id: string;
    menuItemId: string;
    inventoryItemId: string;
    quantityRequired: number;
    createdAt: Date;
    updatedAt: Date;
    inventoryItem: { name: string; unit: import('@prisma/client').InventoryUnit };
  }): MenuItemIngredientDTO {
    return {
      id: item.id,
      menuItemId: item.menuItemId,
      inventoryItemId: item.inventoryItemId,
      inventoryItemName: item.inventoryItem.name,
      inventoryItemUnit: item.inventoryItem.unit as MenuItemIngredientDTO['inventoryItemUnit'],
      quantityRequired: item.quantityRequired,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
