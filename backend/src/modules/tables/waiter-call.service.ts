import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { WaiterCallPayload } from '@repo/shared-types';
import { TablesService } from './tables.service';
import { RealtimeGateway } from '../../websocket/realtime.gateway';
import { WaiterNotificationsService } from './waiter-notifications.service';

@Injectable()
export class WaiterCallService {
  private readonly logger = new Logger(WaiterCallService.name);

  constructor(
    private readonly tablesService: TablesService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly waiterNotificationsService: WaiterNotificationsService,
  ) {}

  async callWaiter(restaurantId?: string, tableId?: string): Promise<WaiterCallPayload> {
    if (!restaurantId) {
      throw new BadRequestException('restaurantId is required');
    }

    if (!tableId) {
      throw new BadRequestException('tableId is required');
    }

    const table = await this.tablesService.findById(tableId, restaurantId);
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const call: WaiterCallPayload = {
      restaurantId,
      tableId,
      tableNumber: table.number,
      requestedAt: new Date().toISOString(),
    };

    await this.waiterNotificationsService.create({
      restaurantId,
      tableId,
      tableNumber: table.number,
      type: 'CALL_WAITER',
      message: `Table ${table.number} is calling a waiter`,
      metadata: {
        requestedAt: call.requestedAt,
      },
    });

    this.realtimeGateway.emitWaiterCall(call);
    this.logger.log(`waiter call emitted restaurant=${restaurantId} table=${table.number}`);
    return call;
  }
}
