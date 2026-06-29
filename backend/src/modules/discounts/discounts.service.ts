import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLogModule,
  DiscountApprovalStatus,
  DiscountType,
  Prisma,
  UserRole,
} from '@prisma/client';
import type { DiscountDTO } from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditTrailService } from '../logs/audit-trail.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class DiscountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrailService: AuditTrailService,
    private readonly settingsService: SettingsService,
  ) {}

  async create(input: {
    orderId: string;
    type: DiscountType;
    value: number;
    reason: string;
    actor: AuthenticatedUser;
  }): Promise<DiscountDTO> {
    if (!input.reason.trim()) {
      throw new BadRequestException('Reason is required');
    }

    const order = await this.prisma.order.findFirst({
      where: {
        id: input.orderId,
        restaurantId: input.actor.restaurantId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const subtotal = await this.resolveOrderSubtotal(input.orderId, input.actor.restaurantId);
    const settings = await this.settingsService.get(input.actor.restaurantId);
    const percentValue =
      input.type === DiscountType.PERCENTAGE
        ? input.value
        : subtotal > 0
          ? (input.value / subtotal) * 100
          : 0;

    const requiresApproval = percentValue > (settings?.maxAutoDiscountPercent ?? 10);
    const discountAmount =
      input.type === DiscountType.PERCENTAGE ? (subtotal * input.value) / 100 : input.value;

    if (subtotal - discountAmount < 0) {
      throw new ConflictException('Discount cannot make order total negative');
    }

    const discount = await this.prisma.discount.create({
      data: {
        orderId: input.orderId,
        type: input.type,
        value: input.value,
        reason: input.reason,
        approvalStatus: requiresApproval
          ? DiscountApprovalStatus.PENDING_APPROVAL
          : DiscountApprovalStatus.APPROVED,
        approvedBy: requiresApproval ? null : input.actor.sub,
        createdBy: input.actor.sub,
      },
    });

    await this.auditTrailService.record({
      actor: {
        restaurantId: input.actor.restaurantId,
        userId: input.actor.sub,
        userName: input.actor.name,
        role: input.actor.role,
        staffCode: input.actor.staffCode,
        sessionId: input.actor.sessionId,
      },
      module: AuditLogModule.ORDERS,
      action: 'DISCOUNT_ADDED',
      actionType: 'ADD_DISCOUNT',
      entityType: 'DISCOUNT',
      entityId: discount.id,
      reason: input.reason,
      after: this.toDto(discount),
      details: {
        orderId: discount.orderId,
        requiresApproval,
      },
      riskFlags: requiresApproval ? ['large_discount'] : [],
      context: {
        ipAddress: input.actor.ipAddress,
        userAgent: input.actor.userAgent,
      },
    });

    return this.toDto(discount);
  }

  async listByOrder(orderId: string, actor: AuthenticatedUser): Promise<DiscountDTO[]> {
    return this.listByOrderInternal(orderId, actor.restaurantId);
  }

  async listByOrderInternal(orderId: string, restaurantId: string): Promise<DiscountDTO[]> {
    const discounts = await this.prisma.discount.findMany({
      where: {
        orderId,
        order: {
          restaurantId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return discounts.map((discount) => this.toDto(discount));
  }

  async listForRestaurant(
    restaurantId: string,
    filters: {
      approvalStatus?: DiscountApprovalStatus;
      type?: DiscountType;
      createdBy?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    } = {},
  ): Promise<DiscountDTO[]> {
    const where: Prisma.DiscountWhereInput = {
      order: {
        restaurantId,
      },
      ...(filters.approvalStatus ? { approvalStatus: filters.approvalStatus } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.createdBy ? { createdBy: filters.createdBy } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { reason: { contains: filters.search } },
              ...(this.isUuid(filters.search)
                ? [{ id: filters.search }, { orderId: filters.search }]
                : []),
            ],
          }
        : {}),
    };

    const discounts = await this.prisma.discount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    return discounts.map((discount) => this.toDto(discount));
  }

  async summarizeByOrder(
    orderId: string,
    restaurantId: string,
    baseSubtotal: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const discounts = await client.discount.findMany({
      where: {
        orderId,
        order: {
          restaurantId,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    let runningSubtotal = baseSubtotal;
    let discountTotal = 0;

    for (const discount of discounts) {
      if (discount.approvalStatus !== DiscountApprovalStatus.APPROVED) {
        continue;
      }

      const discountValue = Number(discount.value);
      const appliedAmount =
        discount.type === DiscountType.PERCENTAGE
          ? (runningSubtotal * discountValue) / 100
          : discountValue;
      const boundedAmount = Math.min(Math.max(appliedAmount, 0), runningSubtotal);
      discountTotal += boundedAmount;
      runningSubtotal = Math.max(runningSubtotal - boundedAmount, 0);
    }

    return {
      discounts,
      discountTotal,
      discountedSubtotal: runningSubtotal,
    };
  }

  async update(
    discountId: string,
    input: {
      value?: number;
      reason: string;
      actor: AuthenticatedUser;
    },
  ): Promise<DiscountDTO> {
    const discount = await this.requireOwnedDiscount(discountId, input.actor);
    const updated = await this.prisma.discount.update({
      where: { id: discountId },
      data: {
        ...(input.value !== undefined ? { value: input.value } : {}),
        reason: input.reason,
      },
    });

    await this.auditTrailService.record({
      actor: {
        restaurantId: input.actor.restaurantId,
        userId: input.actor.sub,
        userName: input.actor.name,
        role: input.actor.role,
        staffCode: input.actor.staffCode,
        sessionId: input.actor.sessionId,
      },
      module: AuditLogModule.ORDERS,
      action: 'DISCOUNT_UPDATED',
      actionType: 'UPDATE_DISCOUNT',
      entityType: 'DISCOUNT',
      entityId: discountId,
      reason: input.reason,
      before: this.toDto(discount),
      after: this.toDto(updated),
      context: {
        ipAddress: input.actor.ipAddress,
        userAgent: input.actor.userAgent,
      },
    });

    return this.toDto(updated);
  }

  async remove(discountId: string, reason: string, actor: AuthenticatedUser): Promise<DiscountDTO> {
    if (!reason.trim()) {
      throw new BadRequestException('Reason is required');
    }

    const discount = await this.requireOwnedDiscount(discountId, actor);
    await this.prisma.discount.delete({
      where: { id: discountId },
    });

    await this.auditTrailService.record({
      actor: {
        restaurantId: actor.restaurantId,
        userId: actor.sub,
        userName: actor.name,
        role: actor.role,
        staffCode: actor.staffCode,
        sessionId: actor.sessionId,
      },
      module: AuditLogModule.ORDERS,
      action: 'DISCOUNT_REMOVED',
      actionType: 'REMOVE_DISCOUNT',
      entityType: 'DISCOUNT',
      entityId: discountId,
      reason,
      before: this.toDto(discount),
      context: {
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      },
    });

    return this.toDto(discount);
  }

  async approve(
    discountId: string,
    reason: string,
    actor: AuthenticatedUser,
  ): Promise<DiscountDTO> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ConflictException('Only admin can approve discounts');
    }

    const discount = await this.requireOwnedDiscount(discountId, actor);
    const updated = await this.prisma.discount.update({
      where: { id: discountId },
      data: {
        approvalStatus: DiscountApprovalStatus.APPROVED,
        approvedBy: actor.sub,
      },
    });

    await this.auditTrailService.record({
      actor: {
        restaurantId: actor.restaurantId,
        userId: actor.sub,
        userName: actor.name,
        role: actor.role,
        staffCode: actor.staffCode,
        sessionId: actor.sessionId,
      },
      module: AuditLogModule.ORDERS,
      action: 'DISCOUNT_APPROVED',
      actionType: 'APPROVE_DISCOUNT',
      entityType: 'DISCOUNT',
      entityId: discountId,
      reason,
      before: this.toDto(discount),
      after: this.toDto(updated),
      context: {
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      },
    });

    return this.toDto(updated);
  }

  async reject(discountId: string, reason: string, actor: AuthenticatedUser): Promise<DiscountDTO> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ConflictException('Only admin can reject discounts');
    }

    const discount = await this.requireOwnedDiscount(discountId, actor);
    const updated = await this.prisma.discount.update({
      where: { id: discountId },
      data: {
        approvalStatus: DiscountApprovalStatus.REJECTED,
        approvedBy: actor.sub,
      },
    });

    await this.auditTrailService.record({
      actor: {
        restaurantId: actor.restaurantId,
        userId: actor.sub,
        userName: actor.name,
        role: actor.role,
        staffCode: actor.staffCode,
        sessionId: actor.sessionId,
      },
      module: AuditLogModule.ORDERS,
      action: 'DISCOUNT_REJECTED',
      actionType: 'REJECT_DISCOUNT',
      entityType: 'DISCOUNT',
      entityId: discountId,
      reason,
      before: this.toDto(discount),
      after: this.toDto(updated),
      context: {
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      },
    });

    return this.toDto(updated);
  }

  private async requireOwnedDiscount(discountId: string, actor: AuthenticatedUser) {
    const discount = await this.prisma.discount.findFirst({
      where: {
        id: discountId,
        order: {
          restaurantId: actor.restaurantId,
        },
      },
    });

    if (!discount) {
      throw new NotFoundException('Discount not found');
    }

    return discount;
  }

  private async resolveOrderSubtotal(orderId: string, restaurantId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: {
        orderId,
        order: {
          restaurantId,
        },
      },
      select: {
        price: true,
        quantity: true,
      },
    });

    return items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private toDto(discount: any): DiscountDTO {
    return {
      id: discount.id,
      orderId: discount.orderId,
      type: discount.type,
      value: Number(discount.value),
      reason: discount.reason,
      approvalStatus: discount.approvalStatus,
      approvedBy: discount.approvedBy ?? null,
      createdBy: discount.createdBy ?? null,
      createdAt: discount.createdAt.toISOString(),
    };
  }
}
