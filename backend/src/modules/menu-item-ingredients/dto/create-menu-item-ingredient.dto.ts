import { IsUUID, IsNumber, Min } from 'class-validator';

export class CreateMenuItemIngredientDto {
  @IsUUID()
  menuItemId!: string;

  @IsUUID()
  inventoryItemId!: string;

  @IsNumber()
  @Min(0)
  quantityRequired!: number;
}
