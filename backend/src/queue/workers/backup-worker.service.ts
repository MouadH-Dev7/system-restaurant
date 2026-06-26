import { Injectable, OnModuleInit } from '@nestjs/common';
import { QueueName } from '@prisma/client';
import type { Job } from 'bullmq';
import { SystemService } from '../../modules/system/system.service';
import { QueueService } from '../queue.service';
import type { BackupQueuePayload } from '../queue.types';

@Injectable()
export class BackupWorkerService implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly systemService: SystemService,
  ) {}

  onModuleInit() {
    this.queueService.createWorker<BackupQueuePayload, { backedUp: true; filePath: string }>(
      QueueName.BACKUPS,
      async (job) => this.process(job),
    );
  }

  private async process(job: Job<BackupQueuePayload, { backedUp: true; filePath: string }, string>) {
    const filePath = await this.systemService.processBackupJob(job.data);
    return { backedUp: true, filePath } as const;
  }
}
