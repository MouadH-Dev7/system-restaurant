import { Injectable, NotFoundException } from '@nestjs/common';
import { QueueName, QueueJobType } from '@prisma/client';
import type { FailedPrintJobDTO } from '@repo/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from './queue.service';
import { PRINT_QUEUE_JOBS } from './queue.constants';
import type { PrintQueuePayload } from './queue.types';

@Injectable()
export class FailedPrintJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async getFailedJobs(restaurantId?: string): Promise<FailedPrintJobDTO[]> {
    const jobs = await this.prisma.failedPrintJob.findMany({
      where: restaurantId ? { restaurantId } : undefined,
      orderBy: { failedAt: 'desc' },
    });

    return jobs.map((job) => ({
      id: job.id,
      queueJobId: job.queueJobId,
      printJobId: job.printJobId,
      printerId: job.printerId,
      jobId: job.jobId,
      restaurantId: job.restaurantId,
      payload: job.payload,
      error: job.error,
      attempts: job.attempts,
      failedAt: job.failedAt.toISOString(),
    }));
  }

  async retryFailedJob(id: string) {
    const failedJob = await this.prisma.failedPrintJob.findUnique({
      where: { id },
      include: {
        printJob: true,
      },
    });

    if (!failedJob) {
      throw new NotFoundException('Failed print job not found');
    }

    const payload = failedJob.payload as unknown as PrintQueuePayload;
    const jobType = this.resolvePrintQueueJobType(payload.type);

    const enqueued = await this.queueService.enqueue({
      queueName: QueueName.PRINTING,
      jobType,
      jobName: this.resolvePrintQueueJobName(payload.type),
      payload,
      restaurantId: failedJob.restaurantId,
    });

    if (failedJob.printJobId) {
      await this.prisma.printJob.update({
        where: { id: failedJob.printJobId },
        data: {
          jobId: enqueued.bullJobId,
          queueJobId: enqueued.queueJob.id,
          status: 'WAITING',
          attempts: 0,
          failedReason: null,
          errorMessage: null,
          processedAt: null,
          printedAt: null,
        },
      });
    }

    await this.prisma.failedPrintJob.delete({
      where: { id },
    });

    return enqueued.queueJob;
  }

  async deleteFailedJob(id: string) {
    const existing = await this.prisma.failedPrintJob.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Failed print job not found');
    }

    await this.prisma.failedPrintJob.delete({ where: { id } });
  }

  private resolvePrintQueueJobName(type: PrintQueuePayload['type']) {
    switch (type) {
      case 'RECEIPT':
        return PRINT_QUEUE_JOBS.RECEIPT.name;
      case 'KITCHEN_TICKET':
        return PRINT_QUEUE_JOBS.KITCHEN_TICKET.name;
      case 'ORDER_UPDATE_TICKET':
        return PRINT_QUEUE_JOBS.ORDER_UPDATE_TICKET.name;
      case 'TEST_PAGE':
        return PRINT_QUEUE_JOBS.TEST_PAGE.name;
    }
  }

  private resolvePrintQueueJobType(type: PrintQueuePayload['type']): QueueJobType {
    switch (type) {
      case 'RECEIPT':
        return PRINT_QUEUE_JOBS.RECEIPT.type;
      case 'KITCHEN_TICKET':
        return PRINT_QUEUE_JOBS.KITCHEN_TICKET.type;
      case 'ORDER_UPDATE_TICKET':
        return PRINT_QUEUE_JOBS.ORDER_UPDATE_TICKET.type;
      case 'TEST_PAGE':
        return PRINT_QUEUE_JOBS.TEST_PAGE.type;
    }
  }
}
