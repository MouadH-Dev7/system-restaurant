import { IsOptional, IsUUID } from 'class-validator';

export class OrderQueryDto {
  @IsUUID()
  restaurantId!: string;

  @IsOptional()
  @IsUUID()
  tableId?: string;

  @IsOptional()
  @IsUUID()
  guestSessionId?: string;
}
