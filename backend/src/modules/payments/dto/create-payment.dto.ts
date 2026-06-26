import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client';
import type { CreatePaymentInput, PaymentMethod } from '@repo/shared-types';

export class CreatePaymentDto implements CreatePaymentInput {
  @IsString()
  orderId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(PrismaPaymentMethod)
  paymentMethod!: PaymentMethod;

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
