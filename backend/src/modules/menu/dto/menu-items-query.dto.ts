import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class MenuItemsQueryDto {
  @IsUUID()
  restaurantId!: string;

  @IsOptional()
  @IsUUID()
  menuId?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  availableOnly?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  activeMenusOnly?: string;
}
