import { Injectable, OnModuleInit } from '@nestjs/common';
import { QueueName } from '@prisma/client';
import type { Job } from 'bullmq';
import { AnalyticsService } from '../../modules/analytics/analytics.service';
import { QueueService } from '../queue.service';
import type { AnalyticsQueuePayload } from '../queue.types';

@Injectable()
export class AnalyticsWorkerService implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  onModuleInit() {
    this.queueService.createWorker<AnalyticsQueuePayload, { cached: true; scope: string }>(
      QueueName.ANALYTICS,
      async (job) => this.process(job),
    );
  }

  private async process(job: Job<AnalyticsQueuePayload, { cached: true; scope: string }, string>) {
    await this.analyticsService.refreshScope(job.data.restaurantId, job.data.scope);
    return { cached: true, scope: job.data.scope } as const;
  }
}
