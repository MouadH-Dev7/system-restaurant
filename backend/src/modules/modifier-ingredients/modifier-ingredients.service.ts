import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  ModifierIngredientDTO,
  UpdateModifierIngredientInput,
} from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateModifierIngredientDto } from './dto/create-modifier-ingredient.dto';

@Injectable()
export class ModifierIngredientsService {
  private readonly logger = new Logger(ModifierIngredientsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByModifierOption(modifierOptionId: string): Promise<ModifierIngredientDTO[]> {
    try {
      const ingredients = await this.prisma.modifierIngredient.findMany({
        where: { modifierOptionId },
        include: {
          modifierOption: { select: { name: true } },
          inventoryItem: { select: { name: true, unit: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      return ingredients.map((item) => this.toDto(item));
    } catch (error) {
      this.logger.error(`findByModifierOption failed for modifierOptionId=${modifierOptionId}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async create(input: CreateModifierIngredientDto): Promise<ModifierIngredientDTO> {
    try {
      const [modifierOption, inventoryItem] = await Promise.all([
        this.prisma.modifierOption.findUnique({ where: { id: input.modifierOptionId }, select: { id: true } }),
        this.prisma.inventoryItem.findUnique({ where: { id: input.inventoryItemId }, select: { id: true, name: true, unit: true } }),
      ]);

      if (!modifierOption) {
        throw new NotFoundException('Modifier option not found');
      }

      if (!inventoryItem) {
        throw new NotFoundException('Inventory item not found');
      }

      const safeQuantity = Number(input.quantityRequired);
      if (isNaN(safeQuantity)) {
        throw new Error(`Invalid quantityRequired: ${input.quantityRequired}`);
      }

      const ingredient = await this.prisma.modifierIngredient.create({
        data: {
          modifierOptionId: input.modifierOptionId,
          inventoryItemId: input.inventoryItemId,
          quantityRequired: safeQuantity,
        },
        include: {
          modifierOption: { select: { name: true } },
          inventoryItem: { select: { name: true, unit: true } },
        },
      });

      return this.toDto(ingredient);
    } catch (error) {
      this.logger.error(`create failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async update(id: string, input: UpdateModifierIngredientInput): Promise<ModifierIngredientDTO> {
    try {
      const existing = await this.prisma.modifierIngredient.findUnique({
        where: { id },
        include: {
          modifierOption: { select: { name: true } },
          inventoryItem: { select: { name: true, unit: true } },
        },
      });

      if (!existing) {
        throw new NotFoundException('Modifier ingredient not found');
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

      const ingredient = await this.prisma.modifierIngredient.update({
        where: { id },
        data: {
          ...(input.inventoryItemId !== undefined ? { inventoryItemId: input.inventoryItemId } : {}),
          ...(safeQuantity !== undefined ? { quantityRequired: safeQuantity } : {}),
        },
        include: {
          modifierOption: { select: { name: true } },
          inventoryItem: { select: { name: true, unit: true } },
        },
      });

      return this.toDto(ingredient);
    } catch (error) {
      this.logger.error(`update failed for id=${id}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const existing = await this.prisma.modifierIngredient.findUnique({ where: { id } });

      if (!existing) {
        throw new NotFoundException('Modifier ingredient not found');
      }

      await this.prisma.modifierIngredient.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`remove failed for id=${id}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  private toDto(item: {
    id: string;
    modifierOptionId: string;
    inventoryItemId: string;
    quantityRequired: number;
    createdAt: Date;
    updatedAt: Date;
    modifierOption: { name: string };
    inventoryItem: { name: string; unit: import('@prisma/client').InventoryUnit };
  }): ModifierIngredientDTO {
    return {
      id: item.id,
      modifierOptionId: item.modifierOptionId,
      modifierOptionName: item.modifierOption.name,
      inventoryItemId: item.inventoryItemId,
      inventoryItemName: item.inventoryItem.name,
      inventoryItemUnit: item.inventoryItem.unit as ModifierIngredientDTO['inventoryItemUnit'],
      quantityRequired: item.quantityRequired,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
