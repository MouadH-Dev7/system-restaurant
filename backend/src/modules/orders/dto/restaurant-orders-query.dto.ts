import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class RestaurantOrdersQueryDto {
  @IsUUID()
  restaurantId!: string;

  @IsOptional()
  @IsIn(['kitchen', 'pos', 'customer'])
  scope?: 'kitchen' | 'pos' | 'customer';

  @IsOptional()
  @IsIn(['list', 'table'])
  view?: 'list' | 'table';

  @IsOptional()
  @IsUUID()
  tableId?: string;

  @IsOptional()
  @IsUUID()
  guestSessionId?: string;

  @IsOptional()
  @IsIn(['today'])
  includeHistory?: 'today';
}
