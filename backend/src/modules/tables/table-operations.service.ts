import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  DiscountDTO,
  TableBillingDTO,
  TableFinancialSummaryDTO,
  TablePaymentTimelineEntryDTO,
  TableTimelineCategory,
  TableTimelineEntryDTO,
} from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountsService } from '../discounts/discounts.service';
import { PaymentsService } from '../payments/payments.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class TableOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
    private readonly discountsService: DiscountsService,
  ) {}

  async getTableBilling(tableId: string, restaurantId: string): Promise<TableBillingDTO> {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId },
      select: { id: true, number: true },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const orderRecords = await this.prisma.order.findMany({
      where: {
        restaurantId,
        tableId,
        status: { in: ['PENDING', 'PREPARING', 'READY', 'DELIVERED'] },
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
            modifiers: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const orders = await Promise.all(orderRecords.map((order) => this.ordersService['toOrderResponse'](order as any)));
    const paymentsRaw = await this.prisma.payment.findMany({
      where: {
        order: {
          restaurantId,
          tableId,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const discountsRaw = await this.prisma.discount.findMany({
      where: {
        order: {
          restaurantId,
          tableId,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const payments: TablePaymentTimelineEntryDTO[] = paymentsRaw.map((payment) => ({
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      createdBy: payment.createdBy ?? null,
      createdAt: payment.createdAt.toISOString(),
      refundedAmount: Number(payment.refundedAmount),
      remainingAmount: Number(payment.remainingAmount),
    }));

    const discounts: DiscountDTO[] = discountsRaw.map((discount) => ({
      id: discount.id,
      orderId: discount.orderId,
      type: discount.type,
      value: Number(discount.value),
      reason: discount.reason,
      approvalStatus: discount.approvalStatus,
      approvedBy: discount.approvedBy ?? null,
      createdBy: discount.createdBy ?? null,
      createdAt: discount.createdAt.toISOString(),
    }));

    const summary: TableFinancialSummaryDTO = {
      tableId,
      tableNumber: table.number,
      subtotal: orders.reduce((sum, order) => sum + order.subtotal, 0),
      discountTotal: orders.reduce((sum, order) => sum + order.discountTotal, 0),
      taxTotal: orders.reduce((sum, order) => sum + order.taxTotal, 0),
      grandTotal: orders.reduce((sum, order) => sum + order.grandTotal, 0),
      paidAmount: orders.reduce((sum, order) => sum + order.paidAmount, 0),
      remainingAmount: orders.reduce((sum, order) => sum + order.remainingAmount, 0),
      ordersCount: orders.length,
      paymentsCount: payments.length,
    };

    return {
      summary,
      orders,
      payments,
      discounts,
    };
  }

  async getTableTimeline(
    tableId: string,
    restaurantId: string,
    category: TableTimelineCategory = 'ALL',
  ): Promise<TableTimelineEntryDTO[]> {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId },
      select: { id: true },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const logs = await this.prisma.auditLog.findMany({
      where: {
        restaurantId,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const entries = logs
      .map((log) => {
        const details = (log.details ?? {}) as Record<string, unknown>;
        const contextTableId =
          typeof details.tableId === 'string'
            ? details.tableId
            : typeof details.notificationTableId === 'string'
              ? details.notificationTableId
              : null;

        if (contextTableId !== tableId) {
          return null;
        }

        const riskFlags = Array.isArray(details.riskFlags)
          ? details.riskFlags.filter((value): value is string => typeof value === 'string')
          : [];

        return {
          id: log.id,
          tableId,
          orderId: typeof details.orderId === 'string' ? details.orderId : null,
          paymentId: typeof details.paymentId === 'string' ? details.paymentId : null,
          actorName: log.userName,
          actorRole: log.role,
          staffCode: typeof details.staffCode === 'string' ? details.staffCode : null,
          action: log.action,
          module: log.module,
          reason: typeof details.reason === 'string' ? details.reason : null,
          riskFlags,
          createdAt: log.createdAt.toISOString(),
          metadata: details,
        } satisfies TableTimelineEntryDTO;
      })
      .filter(Boolean) as TableTimelineEntryDTO[];

    return entries.filter((entry) => {
      if (category === 'ALL') {
        return true;
      }

      if (category === 'HIGH_RISK') {
        return entry.riskFlags.length > 0;
      }

      if (category === 'PAYMENTS') {
        return String(entry.action).includes('PAYMENT') || String(entry.action).includes('REFUND');
      }

      if (category === 'EDITS') {
        return String(entry.action).includes('UPDATE') || String(entry.action).includes('EDIT');
      }

      return true;
    });
  }
}
