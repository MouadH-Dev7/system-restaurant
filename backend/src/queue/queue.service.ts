import { randomUUID } from 'crypto';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Prisma, QueueJobStatus, QueueName, type QueueJobType } from '@prisma/client';
import { Job, Queue, Worker, type JobsOptions, type Processor, type WorkerOptions } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QUEUE_BACKOFF_TYPE, QUEUE_DEFINITIONS, getRetryDelay } from './queue.constants';
import type { EnqueueJobInput, QueueDefinition, QueuePayload } from './queue.types';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<QueueName, Queue>();
  private readonly workers = new Set<Worker>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async onModuleDestroy() {
    await Promise.all([
      ...Array.from(this.workers).map((worker) => worker.close()),
      ...Array.from(this.queues.values()).map((queue) => queue.close()),
    ]);
  }

  async enqueue<TPayload extends QueuePayload>({
    queueName,
    jobType,
    jobName,
    payload,
    restaurantId,
    attempts = 3,
  }: EnqueueJobInput<TPayload>) {
    const bullJobId = randomUUID();

    const queueJob = await this.prisma.queueJob.create({
      data: {
        bullJobId,
        queueName,
        jobType,
        restaurantId: restaurantId ?? null,
        status: QueueJobStatus.WAITING,
        attempts: 0,
        maxAttempts: attempts,
        payload: this.toRequiredJson(payload),
      },
    });

    try {
      const queue = this.getQueue(queueName);
      await queue.add(jobName, payload, this.buildJobOptions(bullJobId, attempts));
      this.logger.log(
        `job created queue=${queueName} type=${jobType} jobId=${bullJobId} restaurantId=${restaurantId ?? 'n/a'}`,
      );
      return { bullJobId, queueJob };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Queue add failed';
      await this.prisma.queueJob.update({
        where: { id: queueJob.id },
        data: {
          status: QueueJobStatus.FAILED,
          error: message,
          failedAt: new Date(),
        },
      });
      throw error;
    }
  }

  createWorker<TPayload extends QueuePayload, TResult = unknown>(
    queueName: QueueName,
    processor: Processor<TPayload, TResult, string>,
    options: Partial<WorkerOptions> = {},
  ) {
    const definition = this.getDefinition(queueName);

    const worker = new Worker<TPayload, TResult, string>(
      definition.bullName,
      processor,
      {
        connection: this.redis.getConnectionOptions(`bullmq:${definition.bullName}:worker`),
        concurrency: definition.concurrency,
        removeOnComplete: { count: 5000 },
        removeOnFail: { count: 5000 },
        settings: {
          backoffStrategy: (attemptsMade) => getRetryDelay(attemptsMade) ?? 30_000,
        },
        ...options,
      },
    );

    worker.on('active', (job) => {
      void this.recordJobStarted(job);
    });

    worker.on('completed', (job, result) => {
      void this.recordJobCompleted(job, result);
    });

    worker.on('failed', (job, error) => {
      void this.recordJobFailed(job, error);
    });

    worker.on('error', (error) => {
      this.logger.error(`worker error queue=${queueName}: ${error.message}`, error.stack);
    });

    this.workers.add(worker);
    return worker;
  }

  async recordJobStarted(job: Job) {
    await this.prisma.queueJob.updateMany({
      where: { bullJobId: String(job.id) },
      data: {
        status: QueueJobStatus.ACTIVE,
        attempts: job.attemptsStarted,
      },
    });
    this.logger.log(`job started queue=${job.queueName} jobId=${job.id} attempt=${job.attemptsStarted}`);
  }

  async recordJobCompleted(job: Job, result: unknown) {
    await this.prisma.queueJob.updateMany({
      where: { bullJobId: String(job.id) },
      data: {
        status: QueueJobStatus.COMPLETED,
        attempts: Math.max(job.attemptsMade, job.attemptsStarted),
        processedAt: new Date(),
        result: this.toJson(result),
        error: null,
      },
    });
    this.logger.log(`job completed queue=${job.queueName} jobId=${job.id}`);
  }

  async recordJobFailed(job: Job | undefined, error: Error) {
    if (!job) {
      this.logger.error(`job failed before hydration: ${error.message}`, error.stack);
      return;
    }

    const maxAttempts = Number(job.opts.attempts ?? 1);
    const attemptsMade = Math.max(job.attemptsMade, job.attemptsStarted);
    const hasRetryRemaining = attemptsMade < maxAttempts;

    if (hasRetryRemaining) {
      await this.prisma.queueJob.updateMany({
        where: { bullJobId: String(job.id) },
        data: {
          status: QueueJobStatus.WAITING,
          attempts: attemptsMade,
          error: error.message,
        },
      });
      const nextAttempt = attemptsMade + 1;
      this.logger.warn(
        `retry attempt queue=${job.queueName} jobId=${job.id} nextAttempt=${nextAttempt} delayMs=${getRetryDelay(nextAttempt)}`,
      );
      return;
    }

    await this.prisma.queueJob.updateMany({
      where: { bullJobId: String(job.id) },
      data: {
        status: QueueJobStatus.FAILED,
        attempts: attemptsMade,
        error: error.message,
        failedAt: new Date(),
      },
    });

    this.logger.error(`job failed queue=${job.queueName} jobId=${job.id}: ${error.message}`, error.stack);
  }

  async removeJob(queueName: QueueName, jobId: string) {
    const job = await this.getQueue(queueName).getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  getQueue(queueName: QueueName) {
    const existing = this.queues.get(queueName);
    if (existing) {
      return existing;
    }

    const definition = this.getDefinition(queueName);
    const queue = new Queue(definition.bullName, {
      connection: this.redis.getConnectionOptions(`bullmq:${definition.bullName}:queue`),
      defaultJobOptions: this.buildJobOptions(undefined, 3),
    });

    this.queues.set(queueName, queue);
    return queue;
  }

  private buildJobOptions(jobId?: string, attempts = 3): JobsOptions {
    return {
      jobId,
      attempts,
      backoff: {
        type: QUEUE_BACKOFF_TYPE,
      },
      removeOnComplete: { count: 5000 },
      removeOnFail: { count: 5000 },
    };
  }

  private getDefinition(queueName: QueueName): QueueDefinition {
    const definition = Object.values(QUEUE_DEFINITIONS).find((entry) => entry.dbName === queueName);
    if (!definition) {
      throw new Error(`Queue definition missing for ${queueName}`);
    }
    return definition;
  }

  private toRequiredJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }

  private toJson(value: unknown): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    if (value === null) {
      return Prisma.JsonNull;
    }

    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }
}
