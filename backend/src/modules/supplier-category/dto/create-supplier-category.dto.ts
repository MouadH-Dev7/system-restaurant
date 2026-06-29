import { IsString, MaxLength } from 'class-validator';
import type { CreateSupplierCategoryInput } from '@repo/shared-types';

export class CreateSupplierCategoryDto implements Omit<CreateSupplierCategoryInput, 'restaurantId'> {
  @IsString()
  @MaxLength(120)
  name!: string;
}
