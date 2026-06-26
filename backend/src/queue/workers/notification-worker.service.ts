import { Injectable, OnModuleInit } from '@nestjs/common';
import { QueueName } from '@prisma/client';
import type { Job } from 'bullmq';
import { RealtimeGateway } from '../../websocket/realtime.gateway';
import { QueueService } from '../queue.service';
import type { NotificationQueuePayload } from '../queue.types';

@Injectable()
export class NotificationWorkerService implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  onModuleInit() {
    this.queueService.createWorker<NotificationQueuePayload, { emitted: true }>(
      QueueName.NOTIFICATIONS,
      async (job) => this.process(job),
    );
  }

  private async process(job: Job<NotificationQueuePayload, { emitted: true }, string>) {
    this.realtimeGateway.emitOrderEvent(job.data.event, job.data.order);
    return { emitted: true } as const;
  }
}
