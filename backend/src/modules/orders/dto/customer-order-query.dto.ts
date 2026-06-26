import { IsOptional, IsUUID } from 'class-validator';

export class CustomerOrderQueryDto {
  @IsOptional()
  @IsUUID()
  restaurantId!: string;

  @IsOptional()
  @IsUUID()
  tableId!: string;

  @IsOptional()
  @IsUUID()
  guestSessionId!: string;
}
