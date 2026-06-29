import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogModule, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import type { PaymentDTO } from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditTrailService } from '../logs/audit-trail.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  async create(input: {
    orderId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNumber?: string | null;
    notes?: string | null;
    reason: string;
    actor: AuthenticatedUser;
  }): Promise<PaymentDTO> {
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

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          orderId: input.orderId,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          status: PaymentStatus.PAID,
          referenceNumber: input.referenceNumber ?? null,
          notes: input.notes ?? null,
          reason: input.reason,
          refundedAmount: 0,
          remainingAmount: input.amount,
          createdBy: input.actor.sub,
          updatedBy: input.actor.sub,
        },
      });

      return created;
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
      action: 'PAYMENT_CREATED',
      actionType: 'CREATE_PAYMENT',
      entityType: 'PAYMENT',
      entityId: payment.id,
      reason: input.reason,
      after: this.toDto(payment),
      details: {
        orderId: payment.orderId,
        amountDelta: payment.amount,
        timestamp: payment.createdAt.toISOString(),
      },
      context: {
        ipAddress: input.actor.ipAddress,
        userAgent: input.actor.userAgent,
      },
    });

    return this.toDto(payment);
  }

  async listByOrder(orderId: string, actor: AuthenticatedUser): Promise<PaymentDTO[]> {
    return this.listByOrderInternal(orderId, actor.restaurantId);
  }

  async listByOrderInternal(orderId: string, restaurantId: string): Promise<PaymentDTO[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        orderId,
        order: {
          restaurantId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payments.map((payment) => this.toDto(payment));
  }

  async listForRestaurant(
    restaurantId: string,
    filters: {
      paymentMethod?: PaymentMethod;
      status?: PaymentStatus;
      createdBy?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    } = {},
  ): Promise<PaymentDTO[]> {
    const where: Prisma.PaymentWhereInput = {
      order: {
        restaurantId,
      },
      ...(filters.paymentMethod ? { paymentMethod: filters.paymentMethod } : {}),
      ...(filters.status ? { status: filters.status } : {}),
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
              { referenceNumber: { contains: filters.search } },
              ...(this.isUuid(filters.search)
                ? [{ id: filters.search }, { orderId: filters.search }]
                : []),
            ],
          }
        : {}),
    };

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 300,
    });

    return payments.map((payment) => this.toDto(payment));
  }

  async summarizeByOrder(orderId: string, restaurantId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const payments = await client.payment.findMany({
      where: {
        orderId,
        order: {
          restaurantId,
        },
      },
    });

    const paidAmount = payments
      .filter((payment) => payment.status !== PaymentStatus.CANCELLED)
      .reduce((sum, payment) => sum + Math.max(Number(payment.amount) - Number(payment.refundedAmount), 0), 0);

    const refundedAmount = payments.reduce((sum, payment) => sum + Number(payment.refundedAmount), 0);

    return {
      payments,
      paidAmount,
      refundedAmount,
    };
  }

  async update(
    paymentId: string,
    input: {
      amount?: number;
      referenceNumber?: string | null;
      notes?: string | null;
      reason: string;
      actor: AuthenticatedUser;
    },
  ): Promise<PaymentDTO> {
    const payment = await this.requireOwnedPayment(paymentId, input.actor);

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new ConflictException('Cancelled payments cannot be modified');
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        ...(input.amount !== undefined
          ? { amount: input.amount, remainingAmount: input.amount - Number(payment.refundedAmount) }
          : {}),
        ...(input.referenceNumber !== undefined ? { referenceNumber: input.referenceNumber } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        reason: input.reason,
        updatedBy: input.actor.sub,
      },
    });

    await this.recordPaymentAudit('PAYMENT_UPDATED', payment, updated, input.reason, input.actor);
    return this.toDto(updated);
  }

  async cancel(paymentId: string, reason: string, actor: AuthenticatedUser): Promise<PaymentDTO> {
    if (!reason.trim()) {
      throw new BadRequestException('Reason is required');
    }

    const payment = await this.requireOwnedPayment(paymentId, actor);
    if (payment.status === PaymentStatus.CANCELLED) {
      return this.toDto(payment);
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.CANCELLED,
        reason,
        updatedBy: actor.sub,
      },
    });

    await this.recordPaymentAudit('PAYMENT_CANCELLED', payment, updated, reason, actor);
    return this.toDto(updated);
  }

  async refund(
    paymentId: string,
    input: {
      amount: number;
      reason: string;
      notes?: string | null;
      actor: AuthenticatedUser;
    },
  ): Promise<PaymentDTO> {
    if (!input.reason.trim()) {
      throw new BadRequestException('Reason is required');
    }

    const payment = await this.requireOwnedPayment(paymentId, input.actor);
    if (input.amount > Number(payment.remainingAmount)) {
      throw new ConflictException('Refund cannot exceed remaining paid amount');
    }

    const refundedAmount = Number(payment.refundedAmount) + input.amount;
    const remainingAmount = Number(payment.amount) - refundedAmount;
    const nextStatus =
      remainingAmount <= 0 ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        refundedAmount,
        remainingAmount,
        status: nextStatus,
        notes: input.notes ?? payment.notes,
        reason: input.reason,
        updatedBy: input.actor.sub,
      },
    });

    await this.recordPaymentAudit('PAYMENT_REFUNDED', payment, updated, input.reason, input.actor);
    return this.toDto(updated);
  }

  async changeMethod(
    paymentId: string,
    input: {
      paymentMethod: PaymentMethod;
      reason: string;
      actor: AuthenticatedUser;
    },
  ): Promise<PaymentDTO> {
    if (!input.reason.trim()) {
      throw new BadRequestException('Reason is required');
    }

    const payment = await this.requireOwnedPayment(paymentId, input.actor);
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new ConflictException('Cannot change payment method after full refund');
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentMethod: input.paymentMethod,
        reason: input.reason,
        updatedBy: input.actor.sub,
      },
    });

    await this.recordPaymentAudit(
      'PAYMENT_METHOD_CHANGED',
      payment,
      updated,
      input.reason,
      input.actor,
    );
    return this.toDto(updated);
  }

  private async requireOwnedPayment(paymentId: string, actor: AuthenticatedUser) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        order: {
          restaurantId: actor.restaurantId,
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private async recordPaymentAudit(
    action: string,
    before: any,
    after: any,
    reason: string,
    actor: AuthenticatedUser,
  ) {
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
      action,
      actionType: action,
      entityType: 'PAYMENT',
      entityId: after.id,
      reason,
      before: this.toDto(before),
      after: this.toDto(after),
      details: {
        orderId: after.orderId,
        amountDelta: Number(after.amount) - Number(before.amount),
        timestamp: after.updatedAt.toISOString(),
      },
      context: {
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      },
    });
  }

  private toDto(payment: any): PaymentDTO {
    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      referenceNumber: payment.referenceNumber ?? null,
      notes: payment.notes ?? null,
      reason: payment.reason ?? null,
      refundedAmount: Number(payment.refundedAmount),
      remainingAmount: Number(payment.remainingAmount),
      createdBy: payment.createdBy ?? null,
      updatedBy: payment.updatedBy ?? null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}
