import { Logger, OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  REALTIME_EVENTS,
  REDIS_ORDER_CHANNELS,
  restaurantRoom,
  tableRoom,
  type RealtimeEvent,
  type RealtimeOrderPayload,
  type WaiterNotificationDTO,
  type WaiterCallPayload,
} from '@repo/shared-types';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';

const KITCHEN_EVENTS: RealtimeEvent[] = [
  REALTIME_EVENTS.ORDER_CREATED,
  REALTIME_EVENTS.ORDER_PREPARING,
  REALTIME_EVENTS.ORDER_READY,
  REALTIME_EVENTS.ORDER_CANCELLED,
];

const CUSTOMER_EVENTS: RealtimeEvent[] = [
  REALTIME_EVENTS.ORDER_PREPARING,
  REALTIME_EVENTS.ORDER_READY,
  REALTIME_EVENTS.ORDER_DELIVERED,
  REALTIME_EVENTS.ORDER_PAID,
  REALTIME_EVENTS.ORDER_CANCELLED,
];

const POS_RESTAURANT_EVENTS: RealtimeEvent[] = [
  REALTIME_EVENTS.ORDER_CREATED,
  REALTIME_EVENTS.ORDER_PREPARING,
  REALTIME_EVENTS.ORDER_READY,
  REALTIME_EVENTS.ORDER_DELIVERED,
  REALTIME_EVENTS.ORDER_PAID,
  REALTIME_EVENTS.ORDER_CANCELLED,
];

function waiterRoom(restaurantId: string) {
  return `waiter:${restaurantId}`;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly redis: RedisService) {}

  onModuleInit() {
    const channels = Object.values(REDIS_ORDER_CHANNELS);
    for (const channel of channels) {
      void this.redis.subscribe(channel, (message) => {
        this.handleRedisMessage(message);
      });
    }

    this.logger.log(`Subscribed to Redis channels: ${channels.join(', ')}`);
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  getConnectedClientsCount() {
    return this.server?.sockets?.sockets?.size ?? 0;
  }

  @SubscribeMessage('kitchen:join')
  handleKitchenJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { restaurantId?: string },
  ) {
    if (!body?.restaurantId) {
      return { ok: false, error: 'restaurantId is required' };
    }

    const room = restaurantRoom(body.restaurantId);
    void client.join(room);
    this.logger.debug(`Kitchen client ${client.id} joined ${room}`);
    return { ok: true, room };
  }

  @SubscribeMessage('admin:join')
  handleAdminJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { restaurantId?: string },
  ) {
    if (!body?.restaurantId) {
      return { ok: false, error: 'restaurantId is required' };
    }

    const room = restaurantRoom(body.restaurantId);
    void client.join(room);
    this.logger.debug(`Admin client ${client.id} joined ${room}`);
    return { ok: true, room };
  }

  @SubscribeMessage('waiter:join')
  handleWaiterJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { restaurantId?: string },
  ) {
    if (!body?.restaurantId) {
      return { ok: false, error: 'restaurantId is required' };
    }

    const room = waiterRoom(body.restaurantId);
    void client.join(room);
    this.logger.debug(`Waiter client ${client.id} joined ${room}`);
    return { ok: true, room };
  }

  @SubscribeMessage('customer:join')
  handleCustomerJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { restaurantId?: string; tableId?: string },
  ) {
    if (!body?.restaurantId || !body?.tableId) {
      return { ok: false, error: 'restaurantId and tableId are required' };
    }

    const room = tableRoom(body.restaurantId, body.tableId);
    void client.join(room);
    this.logger.debug(`Customer client ${client.id} joined ${room}`);
    return { ok: true, room };
  }

  private handleRedisMessage(message: string) {
    let payload: RealtimeOrderPayload;
    try {
      payload = JSON.parse(message) as RealtimeOrderPayload;
    } catch {
      this.logger.warn('Invalid realtime payload received from Redis');
      return;
    }

    const { event, order } = payload;
    this.emitOrderEvent(event, order);
  }

  emitOrderEvent(event: RealtimeEvent, order: RealtimeOrderPayload['order']) {
    const restaurant = restaurantRoom(order.restaurantId);
    const waiter = waiterRoom(order.restaurantId);

    if (KITCHEN_EVENTS.includes(event) || POS_RESTAURANT_EVENTS.includes(event)) {
      this.server.to(restaurant).emit(event, order);
    }

    this.server.to(waiter).emit(event, order);

    if (CUSTOMER_EVENTS.includes(event) && order.tableId) {
      const table = tableRoom(order.restaurantId, order.tableId);
      this.server.to(table).emit(event, order);
    }
  }

  emitWaiterCall(call: WaiterCallPayload) {
    this.server.to(waiterRoom(call.restaurantId)).emit('CALL_WAITER', call);
  }

  emitWaiterNotificationCreated(notification: WaiterNotificationDTO) {
    this.server.to(waiterRoom(notification.restaurantId)).emit('WAITER_NOTIFICATION_CREATED', {
      notification,
    });
  }

  emitWaiterNotificationAccepted(notification: WaiterNotificationDTO) {
    this.server.to(waiterRoom(notification.restaurantId)).emit('WAITER_NOTIFICATION_ACCEPTED', {
      notification,
    });
    if (notification.tableId) {
      this.server
        .to(tableRoom(notification.restaurantId, notification.tableId))
        .emit('WAITER_NOTIFICATION_ACCEPTED', { notification });
    }
  }

  emitWaiterNotificationResolved(notification: WaiterNotificationDTO) {
    this.server.to(waiterRoom(notification.restaurantId)).emit('WAITER_NOTIFICATION_RESOLVED', {
      notification,
    });
    if (notification.tableId) {
      this.server
        .to(tableRoom(notification.restaurantId, notification.tableId))
        .emit('WAITER_NOTIFICATION_RESOLVED', { notification });
    }
  }
}
