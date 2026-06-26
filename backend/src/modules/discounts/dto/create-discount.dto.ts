import { IsEnum, IsNumber, IsString, MaxLength, Min } from 'class-validator';
import type { CreateDiscountInput, DiscountType } from '@repo/shared-types';

export class CreateDiscountDto implements CreateDiscountInput {
  @IsString()
  orderId!: string;

  @IsEnum(['PERCENTAGE', 'FIXED_AMOUNT'])
  type!: DiscountType;

  @IsNumber()
  @Min(0.01)
  value!: number;

  @IsString()
  @MaxLength(240)
  reason!: string;
}
