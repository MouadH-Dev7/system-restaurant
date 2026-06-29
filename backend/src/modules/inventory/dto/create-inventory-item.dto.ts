import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import type { CreateInventoryItemInput, InventoryUnit } from '@repo/shared-types';

export class CreateInventoryItemDto implements Omit<CreateInventoryItemInput, 'restaurantId'> {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEnum(['KG', 'GRAM', 'LITER', 'ML', 'PIECE', 'PACK'] as const)
  unit!: InventoryUnit;

  @IsNumber()
  @Min(0)
  stockLevel!: number;

  @IsNumber()
  @Min(0)
  minAlertLevel!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsUUID()
  supplierId?: string | null;
}
