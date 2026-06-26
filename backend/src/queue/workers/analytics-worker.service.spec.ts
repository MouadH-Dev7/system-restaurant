import { AnalyticsWorkerService } from './analytics-worker.service';

describe('AnalyticsWorkerService', () => {
  it('refreshes cached analytics scopes in a worker', async () => {
    const analyticsService = {
      refreshScope: jest.fn().mockResolvedValue({}),
    } as any;

    const service = new AnalyticsWorkerService({ createWorker: jest.fn() } as any, analyticsService);
    const result = await (service as any).process({
      data: {
        restaurantId: 'restaurant-1',
        scope: 'dashboard',
      },
    });

    expect(analyticsService.refreshScope).toHaveBeenCalledWith('restaurant-1', 'dashboard');
    expect(result).toEqual({ cached: true, scope: 'dashboard' });
  });
});
