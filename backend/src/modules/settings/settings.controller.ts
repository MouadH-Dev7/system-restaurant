import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SettingsService } from './settings.service';
import { UpsertSettingsDto } from './dto/upsert-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER, UserRole.CHEF)
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.get(user.restaurantId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  upsert(@Body() input: UpsertSettingsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.upsert({
      ...input,
      restaurantId: user.restaurantId,
    });
  }
}
