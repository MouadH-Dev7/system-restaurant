import { FailedPrintJobsService } from './failed-print-jobs.service';

describe('FailedPrintJobsService', () => {
  const prisma = {
    failedPrintJob: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    printJob: {
      update: jest.fn(),
    },
  } as any;

  const queueService = {
    enqueue: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists failed print jobs', async () => {
    const service = new FailedPrintJobsService(prisma, queueService);
    prisma.failedPrintJob.findMany.mockResolvedValue([
      {
        id: 'failed-1',
        queueJobId: 'queue-1',
        printJobId: 'print-1',
        printerId: 'printer-1',
        jobId: 'bull-1',
        restaurantId: 'restaurant-1',
        payload: { type: 'RECEIPT' },
        error: 'offline',
        attempts: 3,
        failedAt: new Date('2026-06-10T10:00:00.000Z'),
      },
    ]);

    const result = await service.getFailedJobs('restaurant-1');

    expect(result).toHaveLength(1);
    expect(result[0]?.error).toBe('offline');
  });

  it('retries a failed print job and resets print status', async () => {
    const service = new FailedPrintJobsService(prisma, queueService);
    prisma.failedPrintJob.findUnique.mockResolvedValue({
      id: 'failed-1',
      restaurantId: 'restaurant-1',
      printJobId: 'print-1',
      payload: {
        type: 'RECEIPT',
        printJobId: 'print-1',
        restaurantId: 'restaurant-1',
        rawDocument: '\u001b@receipt',
      },
      printJob: { id: 'print-1' },
    });
    queueService.enqueue.mockResolvedValue({
      bullJobId: 'bull-2',
      queueJob: { id: 'queue-2' },
    });

    await service.retryFailedJob('failed-1');

    expect(queueService.enqueue).toHaveBeenCalled();
    expect(prisma.printJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'WAITING',
          attempts: 0,
        }),
      }),
    );
    expect(prisma.failedPrintJob.delete).toHaveBeenCalledWith({ where: { id: 'failed-1' } });
  });
});
