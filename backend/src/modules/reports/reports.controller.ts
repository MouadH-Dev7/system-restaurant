import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.list(user.restaurantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() input: CreateReportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.create({
      ...input,
      restaurantId: user.restaurantId,
    });
  }
}
