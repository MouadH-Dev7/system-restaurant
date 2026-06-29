import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { UpdateSupplierCategoryInput } from '@repo/shared-types';

export class UpdateSupplierCategoryDto implements UpdateSupplierCategoryInput {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}
