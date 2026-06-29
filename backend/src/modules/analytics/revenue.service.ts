import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { RevenueChartResponse } from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RevenueService {
  private readonly logger = new Logger(RevenueService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRevenueChart(
    restaurantId: string,
    period: 'daily' | 'weekly' | 'monthly',
  ): Promise<RevenueChartResponse> {
    const now = new Date();
    let trunc: string;
    let labels: string[];
    const bucketStarts: Date[] = [];

    if (period === 'daily') {
      trunc = 'day';
      labels = [];
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        d.setDate(now.getDate() - i);
        bucketStarts.push(d);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      }
    } else if (period === 'weekly') {
      trunc = 'week';
      labels = [];
      for (let i = 3; i >= 0; i -= 1) {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - i * 7);
        bucketStarts.push(start);
        labels.push(`W${4 - i}`);
      }
    } else {
      trunc = 'month';
      labels = [];
      for (let i = 5; i >= 0; i -= 1) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        bucketStarts.push(start);
        labels.push(start.toLocaleDateString('en-US', { month: 'short' }));
      }
    }

    try {
      const rows = await this.prisma.$queryRaw<Array<{ period: Date; revenue: string }>>(
        Prisma.sql`
          SELECT period, SUM("total") AS revenue
          FROM (
            SELECT DATE_TRUNC(${trunc}::text, "createdAt") AS period, "total"
            FROM "orders"
            WHERE "restaurantId" = ${restaurantId}::uuid
              AND "status" = 'PAID'
              AND "createdAt" >= ${bucketStarts[0]}
          ) sub
          GROUP BY period
          ORDER BY period
        `,
      );

      const revenueMap = new Map<string, number>();
      for (const row of rows) {
        revenueMap.set(row.period.toISOString(), Number(row.revenue));
      }

      const totals = bucketStarts.map((start) => revenueMap.get(start.toISOString()) ?? 0);

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
    } catch (error) {
      this.logger.error(
        `getRevenueChart failed for restaurant ${restaurantId}, period ${period}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return { labels: [], datasets: [] };
    }
  }
}
