import { Injectable, OnModuleInit } from '@nestjs/common';
import { QueueName } from '@prisma/client';
import type { Job } from 'bullmq';
import { ReportsService } from '../../modules/reports/reports.service';
import { QueueService } from '../queue.service';
import type { ExportQueuePayload } from '../queue.types';

@Injectable()
export class ExportWorkerService implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly reportsService: ReportsService,
  ) {}

  onModuleInit() {
    this.queueService.createWorker<ExportQueuePayload, { exported: true; filePath: string }>(
      QueueName.EXPORTS,
      async (job) => this.process(job),
    );
  }

  private async process(job: Job<ExportQueuePayload, { exported: true; filePath: string }, string>) {
    const filePath = await this.reportsService.processExportJob(job.data.reportJobId);
    return { exported: true, filePath } as const;
  }
}
