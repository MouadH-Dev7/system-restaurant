import { IsEnum, IsString, MaxLength } from 'class-validator';
import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client';
import type { ChangePaymentMethodInput, PaymentMethod } from '@repo/shared-types';

export class ChangePaymentMethodDto implements ChangePaymentMethodInput {
  @IsEnum(PrismaPaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsString()
  @MaxLength(240)
  reason!: string;
}
