import { IsUUID, IsNumber, Min } from 'class-validator';

export class CreateModifierIngredientDto {
  @IsUUID()
  modifierOptionId!: string;

  @IsUUID()
  inventoryItemId!: string;

  @IsNumber()
  @Min(0)
  quantityRequired!: number;
}
