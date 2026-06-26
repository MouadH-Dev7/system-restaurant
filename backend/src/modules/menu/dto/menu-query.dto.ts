import { IsUUID } from 'class-validator';

export class MenuQueryDto {
  @IsUUID()
  restaurantId!: string;
}
