import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import type { CreateSupplierInput } from '@repo/shared-types';

export class CreateSupplierDto implements Omit<CreateSupplierInput, 'restaurantId'> {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  supplyingCategories?: string | null;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'] as const)
  status?: 'ACTIVE' | 'INACTIVE';
}
