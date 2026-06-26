import { Injectable } from '@nestjs/common';
import type { QueueJobType } from '@prisma/client';
import { QueueName } from '@prisma/client';
import type {
  DashboardAnalyticsDTO,
  OrdersSummaryDTO,
  RevenueChartResponse,
  TopDishDTO,
  BusyHourDTO,
} from '@repo/shared-types';
import { ANALYTICS_QUEUE_JOBS } from '../../queue/queue.constants';
import { QueueService } from '../../queue/queue.service';
import type { AnalyticsQueuePayload } from '../../queue/queue.types';
import { RedisService } from '../../redis/redis.service';
import { analyticsCacheKey, ANALYTICS_CACHE_TTL_SECONDS } from './analytics.cache';
import { ReportingService } from './reporting.service';
import { RevenueService } from './revenue.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly revenueService: RevenueService,
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
  ) {}

  async getDashboard(restaurantId: string): Promise<DashboardAnalyticsDTO> {
    return this.readCachedOrSchedule(
      'dashboard',
      restaurantId,
      () => this.emptyDashboard(),
      ANALYTICS_QUEUE_JOBS.DASHBOARD_CALCULATION.type,
      ANALYTICS_QUEUE_JOBS.DASHBOARD_CALCULATION.name,
    );
  }

  async getRevenue(
    restaurantId: string,
    period: 'daily' | 'weekly' | 'monthly',
  ): Promise<RevenueChartResponse> {
    return this.readCachedOrSchedule(
      `revenue:${period}`,
      restaurantId,
      () => this.emptyRevenueChart(period),
      ANALYTICS_QUEUE_JOBS.SALES_AGGREGATION.type,
      ANALYTICS_QUEUE_JOBS.SALES_AGGREGATION.name,
    );
  }

  async getTopDishes(restaurantId: string): Promise<TopDishDTO[]> {
    return this.readCachedOrSchedule(
      'top-dishes',
      restaurantId,
      () => [],
      ANALYTICS_QUEUE_JOBS.DAILY_METRICS.type,
      ANALYTICS_QUEUE_JOBS.DAILY_METRICS.name,
    );
  }

  async getBusyHours(restaurantId: string): Promise<BusyHourDTO[]> {
    return this.readCachedOrSchedule(
      'busy-hours',
      restaurantId,
      () => this.emptyBusyHours(),
      ANALYTICS_QUEUE_JOBS.DAILY_METRICS.type,
      ANALYTICS_QUEUE_JOBS.DAILY_METRICS.name,
    );
  }

  async getOrdersSummary(restaurantId: string): Promise<OrdersSummaryDTO> {
    return this.readCachedOrSchedule(
      'orders-summary',
      restaurantId,
      () => this.emptyOrdersSummary(),
      ANALYTICS_QUEUE_JOBS.DAILY_METRICS.type,
      ANALYTICS_QUEUE_JOBS.DAILY_METRICS.name,
    );
  }

  async scheduleRefreshForRestaurant(restaurantId: string) {
    await Promise.all([
      this.enqueueScope(restaurantId, 'dashboard'),
      this.enqueueScope(restaurantId, 'revenue:daily'),
      this.enqueueScope(restaurantId, 'revenue:weekly'),
      this.enqueueScope(restaurantId, 'revenue:monthly'),
      this.enqueueScope(restaurantId, 'top-dishes'),
      this.enqueueScope(restaurantId, 'busy-hours'),
      this.enqueueScope(restaurantId, 'orders-summary'),
    ]);
  }

  async refreshScope(restaurantId: string, scope: AnalyticsQueuePayload['scope']) {
    const key = analyticsCacheKey(restaurantId, scope);
    const result = await this.computeScope(restaurantId, scope);
    await this.redis.set(key, JSON.stringify(result), ANALYTICS_CACHE_TTL_SECONDS);
    return result;
  }

  private async readCachedOrSchedule<T>(
    scope: string,
    restaurantId: string,
    fallback: () => T,
    jobType: QueueJobType,
    jobName: string,
  ): Promise<T> {
    const key = analyticsCacheKey(restaurantId, scope);
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    await this.queueService.enqueue({
      queueName: QueueName.ANALYTICS,
      jobType,
      jobName,
      payload: {
        restaurantId,
        scope: scope as AnalyticsQueuePayload['scope'],
      },
      restaurantId,
      attempts: 1,
    });

    return fallback();
  }

  private async enqueueScope(restaurantId: string, scope: AnalyticsQueuePayload['scope']) {
    const queueJob = this.resolveQueueJob(scope);
    await this.queueService.enqueue({
      queueName: QueueName.ANALYTICS,
      jobType: queueJob.type,
      jobName: queueJob.name,
      payload: { restaurantId, scope },
      restaurantId,
      attempts: 1,
    });
  }

  private computeScope(restaurantId: string, scope: AnalyticsQueuePayload['scope']) {
    switch (scope) {
      case 'dashboard':
        return this.reportingService.getDashboard(restaurantId);
      case 'revenue:daily':
        return this.revenueService.getRevenueChart(restaurantId, 'daily');
      case 'revenue:weekly':
        return this.revenueService.getRevenueChart(restaurantId, 'weekly');
      case 'revenue:monthly':
        return this.revenueService.getRevenueChart(restaurantId, 'monthly');
      case 'top-dishes':
        return this.reportingService.getTopDishes(restaurantId);
      case 'busy-hours':
        return this.reportingService.getBusyHours(restaurantId);
      case 'orders-summary':
        return this.reportingService.getOrdersSummary(restaurantId);
    }
  }

  private resolveQueueJob(scope: AnalyticsQueuePayload['scope']) {
    if (scope === 'dashboard') {
      return ANALYTICS_QUEUE_JOBS.DASHBOARD_CALCULATION;
    }

    if (scope.startsWith('revenue:')) {
      return ANALYTICS_QUEUE_JOBS.SALES_AGGREGATION;
    }

    return ANALYTICS_QUEUE_JOBS.DAILY_METRICS;
  }

  private emptyDashboard(): DashboardAnalyticsDTO {
    return {
      revenue: {
        today: 0,
        week: 0,
        month: 0,
      },
      orders: {
        total: 0,
        completed: 0,
        cancelled: 0,
      },
      customers: {
        total: 0,
        returning: 0,
      },
      topDishes: [],
      busyHours: this.emptyBusyHours(),
      recentOrders: [],
    };
  }

  private emptyRevenueChart(period: 'daily' | 'weekly' | 'monthly'): RevenueChartResponse {
    const labels =
      period === 'daily'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : period === 'weekly'
          ? ['W1', 'W2', 'W3', 'W4']
          : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    return {
      labels,
      datasets: [
        {
          label: `${period.charAt(0).toUpperCase()}${period.slice(1)} revenue`,
          data: labels.map(() => 0),
          borderColor: '#ac2d00',
          backgroundColor: 'rgba(172,45,0,0.18)',
        },
      ],
    };
  }

  private emptyBusyHours(): BusyHourDTO[] {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      orders: 0,
    }));
  }

  private emptyOrdersSummary(): OrdersSummaryDTO {
    return {
      total: 0,
      pending: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      paid: 0,
      cancelled: 0,
    };
  }
}
