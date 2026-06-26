import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type {
  BusyHourDTO,
  DashboardAnalyticsDTO,
  OrdersSummaryDTO,
  RevenueChartResponse,
  TopDishDTO,
} from '@repo/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser): Promise<DashboardAnalyticsDTO> {
    return this.analyticsService.getDashboard(user.restaurantId);
  }

  @Get('revenue')
  getRevenue(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<RevenueChartResponse> {
    return this.analyticsService.getRevenue(user.restaurantId, period);
  }

  @Get('top-dishes')
  getTopDishes(@CurrentUser() user: AuthenticatedUser): Promise<TopDishDTO[]> {
    return this.analyticsService.getTopDishes(user.restaurantId);
  }

  @Get('busy-hours')
  getBusyHours(@CurrentUser() user: AuthenticatedUser): Promise<BusyHourDTO[]> {
    return this.analyticsService.getBusyHours(user.restaurantId);
  }

  @Get('orders-summary')
  getOrdersSummary(@CurrentUser() user: AuthenticatedUser): Promise<OrdersSummaryDTO> {
    return this.analyticsService.getOrdersSummary(user.restaurantId);
  }
}
