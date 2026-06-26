import { QueueJobStatus, QueueName } from '@prisma/client';
import { QueueService } from './queue.service';

describe('QueueService', () => {
  const queueAdd = jest.fn();
  const queueClose = jest.fn();
  const workerClose = jest.fn();
  const queueJobCreate = jest.fn();
  const queueJobUpdate = jest.fn();
  const queueJobUpdateMany = jest.fn();

  const prisma = {
    queueJob: {
      create: queueJobCreate,
      update: queueJobUpdate,
      updateMany: queueJobUpdateMany,
    },
  } as any;

  const redis = {
    getConnectionOptions: jest.fn().mockReturnValue({ host: '127.0.0.1', port: 6379 }),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    queueJobCreate.mockResolvedValue({ id: 'queue-job-1', status: QueueJobStatus.WAITING });
  });

  it('persists queue metadata when enqueuing a job', async () => {
    const service = new QueueService(prisma, redis);
    (service as any).queues.set(QueueName.PRINTING, {
      add: queueAdd.mockResolvedValue(undefined),
      close: queueClose,
      getJob: jest.fn(),
    });

    const result = await service.enqueue({
      queueName: QueueName.PRINTING,
      jobType: 'PRINT_RECEIPT' as any,
      jobName: 'print-receipt',
      payload: { printJobId: 'print-job-1' } as any,
      restaurantId: 'restaurant-1',
    });

    expect(queueJobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          queueName: QueueName.PRINTING,
          restaurantId: 'restaurant-1',
          maxAttempts: 3,
        }),
      }),
    );
    expect(queueAdd).toHaveBeenCalledWith(
      'print-receipt',
      expect.objectContaining({ printJobId: 'print-job-1' }),
      expect.objectContaining({ attempts: 3 }),
    );
    expect(result.queueJob.id).toBe('queue-job-1');
  });

  it('marks queue jobs active, completed, and waiting on retry', async () => {
    const service = new QueueService(prisma, redis);

    await service.recordJobStarted({
      id: 'bull-1',
      queueName: 'printing',
      attemptsStarted: 1,
    } as any);

    await service.recordJobCompleted(
      {
        id: 'bull-1',
        queueName: 'printing',
        attemptsMade: 1,
        attemptsStarted: 1,
      } as any,
      { ok: true },
    );

    await service.recordJobFailed(
      {
        id: 'bull-1',
        queueName: 'printing',
        attemptsMade: 1,
        attemptsStarted: 1,
        opts: { attempts: 3 },
      } as any,
      new Error('printer offline'),
    );

    expect(queueJobUpdateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({ status: QueueJobStatus.ACTIVE }),
      }),
    );
    expect(queueJobUpdateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({ status: QueueJobStatus.COMPLETED }),
      }),
    );
    expect(queueJobUpdateMany).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        data: expect.objectContaining({ status: QueueJobStatus.WAITING, error: 'printer offline' }),
      }),
    );
  });

  it('marks queue jobs failed after final retry', async () => {
    const service = new QueueService(prisma, redis);

    await service.recordJobFailed(
      {
        id: 'bull-2',
        queueName: 'printing',
        attemptsMade: 3,
        attemptsStarted: 3,
        opts: { attempts: 3 },
      } as any,
      new Error('printer unreachable'),
    );

    expect(queueJobUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: QueueJobStatus.FAILED,
          error: 'printer unreachable',
        }),
      }),
    );
  });
});
