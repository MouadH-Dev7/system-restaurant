import { NotificationWorkerService } from './notification-worker.service';

describe('NotificationWorkerService', () => {
  it('publishes order events through the realtime gateway', async () => {
    const service = new NotificationWorkerService(
      { createWorker: jest.fn() } as any,
      { emitOrderEvent: jest.fn() } as any,
    );

    const gateway = (service as any).realtimeGateway;
    const result = await (service as any).process({
      data: {
        event: 'ORDER_CREATED',
        order: { id: 'order-1', restaurantId: 'restaurant-1', tableId: 'table-1' },
      },
    });

    expect(gateway.emitOrderEvent).toHaveBeenCalledWith(
      'ORDER_CREATED',
      expect.objectContaining({ id: 'order-1' }),
    );
    expect(result).toEqual({ emitted: true });
  });
});
