import { Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Public } from '../auth/public.decorator';
import { SystemService } from './system.service';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  @Public()
  getHealth() {
    return this.systemService.getHealth();
  }

  @Post('backups/:type')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createBackup(@Param('type') type: string, @CurrentUser() user: AuthenticatedUser) {
    return this.systemService.enqueueBackup(user.restaurantId, type);
  }
}
