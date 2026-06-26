import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ListLogsQueryDto } from './dto/list-logs-query.dto';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListLogsQueryDto) {
    return this.logsService.list(user.restaurantId, query);
  }

  @Get('employee-risk')
  @Roles(UserRole.ADMIN)
  employeeRisk(@CurrentUser() user: AuthenticatedUser, @Query() query: ListLogsQueryDto) {
    return this.logsService.getEmployeeRiskProfiles(user.restaurantId, query);
  }
}
