import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogModule, Prisma, WaiterNotificationStatus, WaiterNotificationType } from '@prisma/client';
import type { WaiterNotificationDTO, WaiterNotificationMetadata } from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../websocket/realtime.gateway';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditTrailService } from '../logs/audit-trail.service';

type WaiterNotificationWithRelations = Prisma.WaiterNotificationGetPayload<{
  include: {
    table: true;
    acceptedByUser: true;
  };
}>;

function getNotificationTargetLabel(notification: {
  type: string;
  table?: { number: number } | null;
  message: string;
}) {
  if (notification.type === 'ORDER_READY_FOR_PICKUP') {
    return 'pickup order';
  }

  if (notification.table) {
    return `table ${notification.table.number}`;
  }

  return notification.message;
}

@Injectable()
export class WaiterNotificationsService {
  private readonly logger = new Logger(WaiterNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  async listActive(user: AuthenticatedUser): Promise<WaiterNotificationDTO[]> {
    const isAdmin = user.role === 'ADMIN';
    const notifications = await this.prisma.waiterNotification.findMany({
      where: {
        restaurantId: user.restaurantId,
        OR: [
          {
            status: WaiterNotificationStatus.PENDING,
          },
          ...(isAdmin
            ? [
                {
                  status: WaiterNotificationStatus.ACCEPTED,
                },
              ]
            : [
                {
                  status: WaiterNotificationStatus.ACCEPTED,
                  acceptedByUserId: user.sub,
                },
              ]),
        ],
      },
      include: {
        table: true,
        acceptedByUser: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications.map((notification) => this.toDto(notification));
  }

  async create(input: {
    restaurantId: string;
    tableId?: string | null;
    tableNumber?: number | null;
    type: WaiterNotificationType;
    message: string;
    orderId?: string;
    metadata?: WaiterNotificationMetadata;
  }): Promise<WaiterNotificationDTO> {
    if (input.type === 'CALL_WAITER') {
      if (!input.tableId) {
        throw new ConflictException('Table waiter calls require a table');
      }

      const existingPendingCall = await this.prisma.waiterNotification.findFirst({
        where: {
          restaurantId: input.restaurantId,
          tableId: input.tableId,
          type: WaiterNotificationType.CALL_WAITER,
          status: WaiterNotificationStatus.PENDING,
        },
      });

      if (existingPendingCall) {
        throw new ConflictException('WAITER_CALL_ALREADY_OPEN');
      }
    }

    const notification = await this.prisma.waiterNotification.create({
      data: {
        restaurantId: input.restaurantId,
        tableId: input.tableId ?? null,
        ...(input.orderId ? { orderId: input.orderId } : {}),
        type: input.type,
        status: WaiterNotificationStatus.PENDING,
        message: input.message,
        metadata: this.toJson(input.metadata),
      },
      include: {
        table: true,
        acceptedByUser: true,
      },
    });

    const dto = this.toDto(notification);
    this.realtimeGateway.emitWaiterNotificationCreated(dto);
    return dto;
  }

  async accept(
    notificationId: string,
    user: AuthenticatedUser,
  ): Promise<WaiterNotificationDTO> {
    const notification = await this.prisma.waiterNotification.findFirst({
      where: {
        id: notificationId,
        restaurantId: user.restaurantId,
      },
      include: {
        table: true,
        acceptedByUser: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Waiter notification not found');
    }

    if (notification.status !== WaiterNotificationStatus.PENDING) {
      throw new ConflictException('Waiter notification has already been handled');
    }

    const accepted = await this.prisma.waiterNotification.update({
      where: {
        id: notificationId,
      },
      data: {
        status: WaiterNotificationStatus.ACCEPTED,
        acceptedByUserId: user.sub,
        acceptedAt: new Date(),
      },
      include: {
        table: true,
        acceptedByUser: true,
      },
    });

    await this.auditTrailService.record({
      actor: {
        restaurantId: user.restaurantId,
        userId: user.sub,
        userName: user.name,
        role: user.role,
        staffCode: user.staffCode,
        sessionId: user.sessionId,
      },
      module: AuditLogModule.WAITER_NOTIFICATIONS,
      action: `Accepted waiter notification for ${getNotificationTargetLabel(accepted)}`,
      actionType: 'WAITER_NOTIFICATION_ACCEPTED',
      entityType: 'WAITER_NOTIFICATION',
      entityId: accepted.id,
      after: this.toDto(accepted),
      context: {
        ipAddress: user.ipAddress,
        userAgent: user.userAgent,
      },
    });

    const dto = this.toDto(accepted);
    this.realtimeGateway.emitWaiterNotificationAccepted(dto);
    this.logger.log(`waiter notification accepted id=${notificationId} user=${user.sub}`);
    return dto;
  }

  async resolve(notificationId: string, user: AuthenticatedUser): Promise<WaiterNotificationDTO> {
    const notification = await this.prisma.waiterNotification.findFirst({
      where: {
        id: notificationId,
        restaurantId: user.restaurantId,
      },
      include: {
        table: true,
        acceptedByUser: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Waiter notification not found');
    }

    if (notification.status === WaiterNotificationStatus.RESOLVED) {
      return this.toDto(notification);
    }

    const assignedToAnotherWaiter =
      notification.status === WaiterNotificationStatus.ACCEPTED &&
      notification.acceptedByUserId &&
      notification.acceptedByUserId !== user.sub &&
      user.role !== 'ADMIN';

    if (assignedToAnotherWaiter) {
      throw new ConflictException('Waiter notification is assigned to another waiter');
    }

    const resolved = await this.prisma.waiterNotification.update({
      where: {
        id: notificationId,
      },
      data: {
        status: WaiterNotificationStatus.RESOLVED,
        resolvedAt: new Date(),
      },
      include: {
        table: true,
        acceptedByUser: true,
      },
    });

    await this.auditTrailService.record({
      actor: {
        restaurantId: user.restaurantId,
        userId: user.sub,
        userName: user.name,
        role: user.role,
        staffCode: user.staffCode,
        sessionId: user.sessionId,
      },
      module: AuditLogModule.WAITER_NOTIFICATIONS,
      action: `Resolved waiter notification for ${getNotificationTargetLabel(resolved)}`,
      actionType: 'WAITER_NOTIFICATION_RESOLVED',
      entityType: 'WAITER_NOTIFICATION',
      entityId: resolved.id,
      after: this.toDto(resolved),
      context: {
        ipAddress: user.ipAddress,
        userAgent: user.userAgent,
      },
    });

    const dto = this.toDto(resolved);
    this.realtimeGateway.emitWaiterNotificationResolved(dto);
    return dto;
  }

  private toDto(notification: WaiterNotificationWithRelations): WaiterNotificationDTO {
    return {
      id: notification.id,
      restaurantId: notification.restaurantId,
      tableId: notification.tableId ?? null,
      orderId: notification.orderId,
      acceptedByUserId: notification.acceptedByUserId,
      type: notification.type,
      status: notification.status,
      message: notification.message,
      metadata:
        notification.metadata && typeof notification.metadata === 'object'
          ? (notification.metadata as WaiterNotificationMetadata)
          : null,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      acceptedAt: notification.acceptedAt?.toISOString() ?? null,
      resolvedAt: notification.resolvedAt?.toISOString() ?? null,
      tableNumber: notification.table?.number ?? null,
      acceptedByUserName: notification.acceptedByUser?.name ?? null,
    };
  }

  private toJson(
    value: unknown,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return Prisma.JsonNull;
    }

    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
