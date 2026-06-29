import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateMenuItemIngredientDto {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityRequired?: number;
}
