import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { RefundPaymentInput } from '@repo/shared-types';

export class RefundPaymentDto implements RefundPaymentInput {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @MaxLength(240)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
