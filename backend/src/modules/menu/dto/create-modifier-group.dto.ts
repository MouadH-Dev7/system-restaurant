import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import type { CreateModifierGroupInput } from '@repo/shared-types';

export class CreateModifierGroupDto implements Omit<CreateModifierGroupInput, 'restaurantId'> {
  @IsUUID()
  menuItemId!: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  nameEn?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  nameFr?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  nameAr?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descriptionEn?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descriptionFr?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descriptionAr?: string | null;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelections?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelections?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
