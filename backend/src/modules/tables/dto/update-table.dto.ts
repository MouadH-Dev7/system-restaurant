import { TableStatus } from '@prisma/client';
import { IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class UpdateTableDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  number?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;

  @IsOptional()
  floorName?: string | null;

  @IsOptional()
  @IsUUID()
  floorId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  posX?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  posY?: number | null;

  @IsOptional()
  @IsIn(['round', 'square'])
  shape?: 'round' | 'square' | null;
}
