import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateModifierIngredientDto {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityRequired?: number;
}
