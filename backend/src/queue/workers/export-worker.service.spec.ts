import { ExportWorkerService } from './export-worker.service';

describe('ExportWorkerService', () => {
  it('processes export jobs asynchronously', async () => {
    const reportsService = {
      processExportJob: jest.fn().mockResolvedValue('C:\\exports\\sales.json'),
    } as any;

    const service = new ExportWorkerService({ createWorker: jest.fn() } as any, reportsService);
    const result = await (service as any).process({
      data: {
        reportJobId: 'report-1',
      },
    });

    expect(reportsService.processExportJob).toHaveBeenCalledWith('report-1');
    expect(result).toEqual({ exported: true, filePath: 'C:\\exports\\sales.json' });
  });
});
