import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { CreateInventoryItemInput } from '@repo/shared-types';

export class CreateInventoryItemDto implements Omit<CreateInventoryItemInput, 'restaurantId'> {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(32)
  unit!: string;

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
  @IsString()
  @MaxLength(160)
  supplier!: string;
}
