import { mkdir, writeFile } from 'fs/promises';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { QueueName } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BACKUP_QUEUE_JOBS } from '../../queue/queue.constants';
import { resolveStoragePath } from '../../queue/queue-storage.util';
import { QueueService } from '../../queue/queue.service';
import type { BackupQueuePayload } from '../../queue/queue.types';
import { RedisService } from '../../redis/redis.service';
import { RealtimeGateway } from '../../websocket/realtime.gateway';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly queueService: QueueService,
  ) {}

  async getHealth() {
    const startedAt = Date.now();

    let databaseStatus: 'online' | 'offline' = 'online';
    let redisStatus: 'online' | 'offline' = 'online';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error(`Health check - database ping failed: ${(error as Error).message}`, (error as Error).stack);
      databaseStatus = 'offline';
    }

    try {
      await this.redis.set('system:health:ping', 'ok', 5);
      await this.redis.get('system:health:ping');
    } catch (error) {
      this.logger.error(`Health check - redis ping failed: ${(error as Error).message}`, (error as Error).stack);
      redisStatus = 'offline';
    }

    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    return {
      status: databaseStatus === 'online' && redisStatus === 'online' ? 'online' : 'warning',
      checkedAt: new Date().toISOString(),
      uptimeSeconds,
      api: {
        status: 'online',
        latencyMs: Date.now() - startedAt,
        memoryMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      },
      database: {
        status: databaseStatus,
      },
      redis: {
        status: redisStatus,
      },
      realtime: {
        status: 'online',
        connectedClients: this.realtimeGateway.getConnectedClientsCount(),
      },
    };
  }

  async enqueueBackup(restaurantId: string, type: string) {
    const normalizedType = type.toUpperCase() as BackupQueuePayload['type'];
    const queueJob = this.resolveBackupQueueJob(normalizedType);

    const enqueued = await this.queueService.enqueue({
      queueName: QueueName.BACKUPS,
      jobType: queueJob.type,
      jobName: queueJob.name,
      payload: {
        restaurantId,
        type: normalizedType,
        requestedAt: new Date().toISOString(),
      },
      restaurantId,
    });

    return {
      bullJobId: enqueued.bullJobId,
      queueJobId: enqueued.queueJob.id,
      status: enqueued.queueJob.status,
      type: normalizedType,
    };
  }

  async processBackupJob(payload: BackupQueuePayload) {
    const directory = resolveStoragePath('backups', payload.restaurantId);
    await mkdir(directory, { recursive: true });
    const filePath = resolveStoragePath(
      'backups',
      payload.restaurantId,
      `${payload.type.toLowerCase()}-${payload.requestedAt.replace(/[:.]/g, '-')}.json`,
    );

    const data = await this.buildBackupPayload(payload);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return filePath;
  }

  private resolveBackupQueueJob(type: BackupQueuePayload['type']) {
    switch (type) {
      case 'DATABASE':
        return BACKUP_QUEUE_JOBS.DATABASE;
      case 'REPORTS':
        return BACKUP_QUEUE_JOBS.REPORTS;
      case 'SETTINGS':
        return BACKUP_QUEUE_JOBS.SETTINGS;
      default:
        throw new BadRequestException(`Unsupported backup type: ${type}`);
    }
  }

  private async buildBackupPayload(payload: BackupQueuePayload) {
    switch (payload.type) {
      case 'DATABASE':
        return {
          restaurant: await this.prisma.restaurant.findUnique({
            where: { id: payload.restaurantId },
          }),
          tables: await this.prisma.table.findMany({
            where: { restaurantId: payload.restaurantId },
          }),
          orders: await this.prisma.order.findMany({
            where: { restaurantId: payload.restaurantId },
            include: {
              items: {
                include: {
                  modifiers: true,
                },
              },
              payments: true,
            },
          }),
          inventory: await this.prisma.inventoryItem.findMany({
            where: { restaurantId: payload.restaurantId },
          }),
          customers: await this.prisma.customerProfile.findMany({
            where: { restaurantId: payload.restaurantId },
          }),
        };
      case 'REPORTS':
        return {
          reportJobs: await this.prisma.reportExportJob.findMany({
            where: { restaurantId: payload.restaurantId },
            orderBy: { createdAt: 'desc' },
          }),
          queueJobs: await this.prisma.queueJob.findMany({
            where: {
              restaurantId: payload.restaurantId,
              queueName: QueueName.EXPORTS,
            },
            orderBy: { createdAt: 'desc' },
          }),
        };
      case 'SETTINGS':
        return {
          settings: await this.prisma.restaurantSettings.findUnique({
            where: { restaurantId: payload.restaurantId },
          }),
          printers: await this.prisma.printerConfig.findMany({
            where: { restaurantId: payload.restaurantId },
          }),
          users: await this.prisma.user.findMany({
            where: { restaurantId: payload.restaurantId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
        };
    }
  }
}
