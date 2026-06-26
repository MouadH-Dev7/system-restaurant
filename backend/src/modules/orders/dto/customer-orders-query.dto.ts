import { IsOptional, IsUUID } from 'class-validator';

export class CustomerOrdersQueryDto {
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
