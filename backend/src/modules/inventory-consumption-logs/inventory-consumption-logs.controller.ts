import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { InventoryConsumptionLogsService } from './inventory-consumption-logs.service';

@Controller('inventory-consumption-logs')
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class InventoryConsumptionLogsController {
  constructor(private readonly service: InventoryConsumptionLogsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('inventoryItemId') inventoryItemId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('orderType') orderType?: string,
    @Query('dailyOrderNumber') dailyOrderNumber?: string,
  ) {
    return this.service.list({
      restaurantId: user.restaurantId,
      inventoryItemId,
      startDate,
      endDate,
      type,
      orderType,
      dailyOrderNumber: dailyOrderNumber ? Number(dailyOrderNumber) : undefined,
    });
  }
}
