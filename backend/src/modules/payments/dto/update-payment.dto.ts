import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { UpdatePaymentInput } from '@repo/shared-types';

export class UpdatePaymentDto implements UpdatePaymentInput {
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  referenceNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsString()
  @MaxLength(240)
  reason!: string;
}
