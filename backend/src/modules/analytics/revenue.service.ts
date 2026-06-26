import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import type { RevenueChartResponse } from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueChart(
    restaurantId: string,
    period: 'daily' | 'weekly' | 'monthly',
  ): Promise<RevenueChartResponse> {
    const now = new Date();
    const labels: string[] = [];
    const totals: number[] = [];

    if (period === 'daily') {
      for (let i = 6; i >= 0; i -= 1) {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(now.getDate() - i);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        labels.push(start.toLocaleDateString('en-US', { weekday: 'short' }));
        totals.push(await this.sumRevenue(restaurantId, start, end));
      }
    } else if (period === 'weekly') {
      for (let i = 3; i >= 0; i -= 1) {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - i * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        labels.push(`W${4 - i}`);
        totals.push(await this.sumRevenue(restaurantId, start, end));
      }
    } else {
      for (let i = 5; i >= 0; i -= 1) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        labels.push(start.toLocaleDateString('en-US', { month: 'short' }));
        totals.push(await this.sumRevenue(restaurantId, start, end));
      }
    }

    const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);

    return {
      labels,
      datasets: [
        {
          label: `${periodLabel} revenue`,
          data: totals,
          borderColor: '#ac2d00',
          backgroundColor: 'rgba(172,45,0,0.18)',
        },
      ],
    };
  }

  private async sumRevenue(restaurantId: string, start: Date, end: Date) {
    const aggregate = await this.prisma.order.aggregate({
      where: {
        restaurantId,
        status: OrderStatus.PAID,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        total: true,
      },
    });

    return aggregate._sum.total ?? 0;
  }
}
