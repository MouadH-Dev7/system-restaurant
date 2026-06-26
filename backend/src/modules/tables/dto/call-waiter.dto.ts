import { IsUUID } from 'class-validator';

export class CallWaiterDto {
  @IsUUID()
  restaurantId!: string;

  @IsUUID()
  tableId!: string;
}
