import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import type { UpdateInventoryItemInput, InventoryUnit } from '@repo/shared-types';

export class UpdateInventoryItemDto implements UpdateInventoryItemInput {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(['KG', 'GRAM', 'LITER', 'ML', 'PIECE', 'PACK'] as const)
  unit?: InventoryUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAlertLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsUUID()
  supplierId?: string | null;
}
