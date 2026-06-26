import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueueModule } from '../../queue/queue.module';
import { RedisModule } from '../../redis/redis.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ReportingService } from './reporting.service';
import { RevenueService } from './revenue.service';

@Module({
  imports: [PrismaModule, RedisModule, QueueModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RevenueService, ReportingService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
