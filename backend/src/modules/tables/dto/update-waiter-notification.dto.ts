import { IsEnum } from 'class-validator';

const WAITER_NOTIFICATION_ACTIONS = ['ACCEPTED', 'RESOLVED'] as const;

export class UpdateWaiterNotificationDto {
  @IsEnum(WAITER_NOTIFICATION_ACTIONS)
  status!: 'ACCEPTED' | 'RESOLVED';
}
