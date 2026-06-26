import { Injectable } from '@nestjs/common';
import { OrderStatus, QueueName } from '@prisma/client';
import {
  REALTIME_EVENTS,
  type OrderResponse,
  type RealtimeEvent,
} from '@repo/shared-types';
import { NOTIFICATION_QUEUE_JOBS } from '../queue/queue.constants';
import { QueueService } from '../queue/queue.service';
import type { NotificationQueuePayload } from '../queue/queue.types';

@Injectable()
export class OrderRealtimePublisher {
  constructor(private readonly queueService: QueueService) {}

  async publishOrderCreated(order: OrderResponse) {
    await this.publish(REALTIME_EVENTS.ORDER_CREATED, order);
  }

  async publishStatusChange(previousStatus: OrderStatus, order: OrderResponse) {
    const mapping = this.mapStatusToEvent(order.status, previousStatus);
    if (!mapping) {
      return;
    }

    await this.publish(mapping.event, order);
  }

  private async publish(event: RealtimeEvent, order: OrderResponse) {
    const queueJob = this.resolveQueueJob(event);
    const payload: NotificationQueuePayload = { event, order };

    await this.queueService.enqueue({
      queueName: QueueName.NOTIFICATIONS,
      jobType: queueJob.type,
      jobName: queueJob.name,
      payload,
      restaurantId: order.restaurantId,
    });
  }

  private mapStatusToEvent(
    status: OrderResponse['status'],
    previousStatus: OrderStatus,
  ): { event: RealtimeEvent } | null {
    if (status === previousStatus) {
      return null;
    }

    switch (status) {
      case 'PREPARING':
        return { event: REALTIME_EVENTS.ORDER_PREPARING };
      case 'READY':
        return { event: REALTIME_EVENTS.ORDER_READY };
      case 'DELIVERED':
        return { event: REALTIME_EVENTS.ORDER_DELIVERED };
      case 'PAID':
        return { event: REALTIME_EVENTS.ORDER_PAID };
      case 'CANCELLED':
        return { event: REALTIME_EVENTS.ORDER_CANCELLED };
      default:
        return null;
    }
  }

  private resolveQueueJob(event: RealtimeEvent) {
    switch (event) {
      case REALTIME_EVENTS.ORDER_CREATED:
        return NOTIFICATION_QUEUE_JOBS.ORDER_CREATED;
      case REALTIME_EVENTS.ORDER_PREPARING:
        return NOTIFICATION_QUEUE_JOBS.ORDER_PREPARING;
      case REALTIME_EVENTS.ORDER_READY:
        return NOTIFICATION_QUEUE_JOBS.ORDER_READY;
      case REALTIME_EVENTS.ORDER_DELIVERED:
        return NOTIFICATION_QUEUE_JOBS.ORDER_DELIVERED;
      case REALTIME_EVENTS.ORDER_PAID:
        return NOTIFICATION_QUEUE_JOBS.ORDER_PAID;
      case REALTIME_EVENTS.ORDER_CANCELLED:
        return NOTIFICATION_QUEUE_JOBS.ORDER_PAID;
      default:
        throw new Error(
          `Unsupported realtime event for notification queue: ${event}`,
        );
    }
  }
}
