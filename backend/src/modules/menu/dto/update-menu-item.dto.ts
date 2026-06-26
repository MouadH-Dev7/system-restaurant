import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import type { UpdateMenuItemInput } from '@repo/shared-types';

export class UpdateMenuItemDto implements UpdateMenuItemInput {
  @IsOptional()
  @IsUUID()
  menuId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

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
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  image?: string | null;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  badge?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  badgeEn?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  badgeFr?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  badgeAr?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
