import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { UpdateDiscountInput } from '@repo/shared-types';

export class UpdateDiscountDto implements UpdateDiscountInput {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  value?: number;

  @IsString()
  @MaxLength(240)
  reason!: string;
}
