import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrintJobStatus, QueueJobType, QueueName } from '@prisma/client';
import type { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { PRINT_QUEUE_JOBS } from '../queue.constants';
import { QueueService } from '../queue.service';
import type { PrintQueuePayload } from '../queue.types';
import { PrinterTransportService } from '../../modules/printing/printer-transport.service';

@Injectable()
export class PrintingWorkerService implements OnModuleInit {
  private readonly logger = new Logger(PrintingWorkerService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
    private readonly printerTransport: PrinterTransportService,
  ) {}

  onModuleInit() {
    this.queueService.createWorker<PrintQueuePayload, { delivered: true }>(
      QueueName.PRINTING,
      async (job) => this.process(job),
    );
  }

  private async process(job: Job<PrintQueuePayload, { delivered: true }, string>) {
    const payload = job.data;
    const printJob = await this.prisma.printJob.findUnique({
      where: { id: payload.printJobId },
      include: {
        printer: true,
      },
    });

    if (!printJob) {
      throw new Error(`Print job ${payload.printJobId} not found`);
    }

    await this.prisma.printJob.update({
      where: { id: printJob.id },
      data: {
        status: PrintJobStatus.ACTIVE,
        attempts: Math.max(job.attemptsMade, job.attemptsStarted),
        failedReason: null,
        errorMessage: null,
      },
    });

    const host = printJob.printer?.ipAddress;
    const port = printJob.printer?.port;

    if (!host || !port) {
      throw new Error(`Printer configuration missing for print job ${printJob.id}`);
    }

    try {
      await this.printerTransport.send(
        {
          host,
          port,
        },
        payload.rawDocument,
      );

      await this.prisma.printJob.update({
        where: { id: printJob.id },
        data: {
          status: PrintJobStatus.COMPLETED,
          attempts: Math.max(job.attemptsMade + 1, job.attemptsStarted),
          result: { delivered: true },
          failedReason: null,
          errorMessage: null,
          processedAt: new Date(),
          printedAt: new Date(),
        },
      });

      return { delivered: true } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Print worker failed';

      await this.prisma.printJob.update({
        where: { id: printJob.id },
        data: {
          status:
            job.attemptsMade + 1 >= Number(job.opts.attempts ?? 1)
              ? PrintJobStatus.FAILED
              : PrintJobStatus.WAITING,
          attempts: Math.max(job.attemptsMade + 1, job.attemptsStarted),
          failedReason: message,
          errorMessage: message,
          processedAt: new Date(),
        },
      });

      if (job.attemptsMade + 1 >= Number(job.opts.attempts ?? 1)) {
        const queueJob = await this.prisma.queueJob.findUnique({
          where: { bullJobId: String(job.id) },
        });

        if (queueJob) {
          await this.prisma.failedPrintJob.upsert({
            where: { queueJobId: queueJob.id },
            update: {
              printJobId: printJob.id,
              printerId: printJob.printerId,
              jobId: String(job.id),
              restaurantId: payload.restaurantId,
              payload: payload as unknown as object,
              error: message,
              attempts: Math.max(job.attemptsMade + 1, job.attemptsStarted),
              failedAt: new Date(),
            },
            create: {
              queueJobId: queueJob.id,
              printJobId: printJob.id,
              printerId: printJob.printerId,
              jobId: String(job.id),
              restaurantId: payload.restaurantId,
              payload: payload as unknown as object,
              error: message,
              attempts: Math.max(job.attemptsMade + 1, job.attemptsStarted),
              failedAt: new Date(),
            },
          });

          this.logger.error(`dead-letter move queue=PRINTING jobId=${job.id} printJobId=${printJob.id}: ${message}`);

          await this.queueService.enqueue({
            queueName: QueueName.FAILED_PRINT_JOBS,
            jobType: this.resolveDeadLetterJobType(payload.type),
            jobName: 'failed-print-jobs',
            payload: {
              failedPrintJobId: printJob.id,
            } as any,
            restaurantId: payload.restaurantId,
            attempts: 1,
          });
        }
      }

      throw error;
    }
  }

  private resolveDeadLetterJobType(type: PrintQueuePayload['type']) {
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
