import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import type { OrderStatus as SharedOrderStatus } from '@repo/shared-types';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: SharedOrderStatus;
  @IsOptional()
  @IsString()
  @MaxLength(240)
  reason?: string;
}
