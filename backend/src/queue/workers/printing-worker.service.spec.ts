import { PrintJobStatus } from '@prisma/client';
import { PrintingWorkerService } from './printing-worker.service';

describe('PrintingWorkerService', () => {
  const queueService = {
    createWorker: jest.fn(),
    enqueue: jest.fn().mockResolvedValue({}),
  } as any;

  const prisma = {
    printJob: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    queueJob: {
      findUnique: jest.fn(),
    },
    failedPrintJob: {
      upsert: jest.fn(),
    },
  } as any;

  const printerTransport = {
    send: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delivers print jobs through the printer transport', async () => {
    const service = new PrintingWorkerService(queueService, prisma, printerTransport);
    prisma.printJob.findUnique.mockResolvedValue({
      id: 'print-job-1',
      printerId: 'printer-1',
      printer: { ipAddress: '127.0.0.1', port: 9100 },
    });
    printerTransport.send.mockResolvedValue(undefined);

    const result = await (service as any).process({
      data: {
        printJobId: 'print-job-1',
        restaurantId: 'restaurant-1',
        rawDocument: '\u001b@hello',
      },
      attemptsMade: 0,
      attemptsStarted: 1,
      opts: { attempts: 3 },
    });

    expect(printerTransport.send).toHaveBeenCalledWith(
      { host: '127.0.0.1', port: 9100 },
      '\u001b@hello',
    );
    expect(prisma.printJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PrintJobStatus.COMPLETED }),
      }),
    );
    expect(result).toEqual({ delivered: true });
  });

  it('stores dead-letter state after final printer failure', async () => {
    const service = new PrintingWorkerService(queueService, prisma, printerTransport);
    prisma.printJob.findUnique.mockResolvedValue({
      id: 'print-job-2',
      printerId: 'printer-1',
      printer: { ipAddress: '127.0.0.1', port: 9100 },
    });
    prisma.queueJob.findUnique.mockResolvedValue({ id: 'queue-job-2' });
    printerTransport.send.mockRejectedValue(new Error('socket timeout'));

    await expect(
      (service as any).process({
        id: 'bull-2',
        data: {
          printJobId: 'print-job-2',
          restaurantId: 'restaurant-1',
          rawDocument: '\u001b@test',
        },
        attemptsMade: 2,
        attemptsStarted: 3,
        opts: { attempts: 3 },
      }),
    ).rejects.toThrow('socket timeout');

    expect(prisma.failedPrintJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          restaurantId: 'restaurant-1',
          error: 'socket timeout',
        }),
      }),
    );
    expect(queueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        queueName: 'FAILED_PRINT_JOBS',
        jobName: 'failed-print-jobs',
      }),
    );
    expect(prisma.printJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PrintJobStatus.FAILED }),
      }),
    );
  });
});
