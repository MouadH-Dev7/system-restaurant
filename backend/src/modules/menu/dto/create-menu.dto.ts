import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { CreateMenuInput } from '@repo/shared-types';

export class CreateMenuDto implements Omit<CreateMenuInput, 'restaurantId'> {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameEn?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameFr?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
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
  @IsString()
  @MaxLength(1000)
  image?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  heroImage?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  themeKey?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
