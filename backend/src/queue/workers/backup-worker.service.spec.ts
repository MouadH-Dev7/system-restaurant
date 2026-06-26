import { BackupWorkerService } from './backup-worker.service';

describe('BackupWorkerService', () => {
  it('processes backup jobs asynchronously', async () => {
    const systemService = {
      processBackupJob: jest.fn().mockResolvedValue('C:\\backups\\database.json'),
    } as any;

    const service = new BackupWorkerService({ createWorker: jest.fn() } as any, systemService);
    const result = await (service as any).process({
      data: {
        restaurantId: 'restaurant-1',
        type: 'DATABASE',
        requestedAt: '2026-06-10T10:00:00.000Z',
      },
    });

    expect(systemService.processBackupJob).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DATABASE' }),
    );
    expect(result).toEqual({ backedUp: true, filePath: 'C:\\backups\\database.json' });
  });
});
