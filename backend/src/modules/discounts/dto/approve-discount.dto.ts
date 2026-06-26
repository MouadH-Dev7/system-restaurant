import { IsString, MaxLength } from 'class-validator';
import type { ApproveDiscountInput } from '@repo/shared-types';

export class ApproveDiscountDto implements ApproveDiscountInput {
  @IsString()
  @MaxLength(240)
  reason!: string;
}
