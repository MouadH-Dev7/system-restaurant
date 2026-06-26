import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import type {
  BusyHourDTO,
  DashboardAnalyticsDTO,
  DashboardRecentOrder,
  OrderFinancialStatus,
  OrdersSummaryDTO,
  TopDishDTO,
} from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(restaurantId: string): Promise<DashboardAnalyticsDTO> {
    const [revenue, orders, customers, topDishes, busyHours, recentOrders] = await Promise.all([
      this.getRevenueMetrics(restaurantId),
      this.getOrderMetrics(restaurantId),
      this.getCustomerMetrics(restaurantId),
      this.getTopDishes(restaurantId),
      this.getBusyHours(restaurantId),
      this.getRecentOrders(restaurantId),
    ]);

    return {
      revenue,
      orders,
      customers,
      topDishes,
      busyHours,
      recentOrders,
    };
  }

  async getTopDishes(restaurantId: string): Promise<TopDishDTO[]> {
    const rows = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          restaurantId,
          status: OrderStatus.PAID,
        },
      },
      _sum: {
        quantity: true,
        price: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    const menuItemIds = rows.map((row) => row.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemIds,
        },
      },
    });
    const menuById = new Map(menuItems.map((item) => [item.id, item]));

    return rows.map((row) => {
      const item = menuById.get(row.menuItemId);
      return {
        menuItemId: row.menuItemId,
        name: item?.name ?? row.menuItemId,
        quantitySold: row._sum.quantity ?? 0,
        revenue: (row._sum.price ?? 0) * (row._sum.quantity ?? 0),
      };
    });
  }

  async getBusyHours(restaurantId: string): Promise<BusyHourDTO[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
      },
      select: {
        createdAt: true,
      },
    });

    const buckets = new Map<number, number>();
    for (let hour = 0; hour < 24; hour += 1) {
      buckets.set(hour, 0);
    }

    for (const order of orders) {
      const hour = order.createdAt.getHours();
      buckets.set(hour, (buckets.get(hour) ?? 0) + 1);
    }

    return Array.from(buckets.entries()).map(([hour, count]) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      orders: count,
    }));
  }

  async getOrdersSummary(restaurantId: string): Promise<OrdersSummaryDTO> {
    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      where: { restaurantId },
      _count: {
        status: true,
      },
    });

    const summary: OrdersSummaryDTO = {
      total: 0,
      pending: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      paid: 0,
      cancelled: 0,
    };

    for (const row of rows) {
      const count = row._count.status;
      summary.total += count;
      if (row.status === OrderStatus.PENDING) summary.pending = count;
      if (row.status === OrderStatus.PREPARING) summary.preparing = count;
      if (row.status === OrderStatus.READY) summary.ready = count;
      if (row.status === OrderStatus.DELIVERED) summary.delivered = count;
      if (row.status === OrderStatus.PAID) summary.paid = count;
      if (row.status === OrderStatus.CANCELLED) summary.cancelled = count;
    }

    return summary;
  }

  private async getRevenueMetrics(restaurantId: string) {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, week, month] = await Promise.all([
      this.sumRevenue(restaurantId, startOfToday),
      this.sumRevenue(restaurantId, startOfWeek),
      this.sumRevenue(restaurantId, startOfMonth),
    ]);

    return { today, week, month };
  }

  private async getOrderMetrics(restaurantId: string) {
    const [total, completed, cancelled] = await Promise.all([
      this.prisma.order.count({ where: { restaurantId } }),
      this.prisma.order.count({ where: { restaurantId, status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { restaurantId, status: OrderStatus.CANCELLED } }),
    ]);

    return { total, completed, cancelled };
  }

  private async getCustomerMetrics(restaurantId: string) {
    const orders = await this.prisma.order.findMany({
      where: { restaurantId },
      select: { guestSessionId: true },
    });

    const totals = new Map<string, number>();
    for (const order of orders) {
      if (!order.guestSessionId) {
        continue;
      }
      totals.set(order.guestSessionId, (totals.get(order.guestSessionId) ?? 0) + 1);
    }

    let returning = 0;
    for (const count of totals.values()) {
      if (count > 1) {
        returning += 1;
      }
    }

    return {
      total: totals.size,
      returning,
    };
  }

  private async getRecentOrders(restaurantId: string): Promise<DashboardRecentOrder[]> {
    const orders = await this.prisma.order.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        table: true,
        items: true,
        payments: true,
        discounts: true,
      },
    });

    return orders.map((order) => {
      const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const discountTotal = order.discounts.reduce((sum, discount) => {
        if (discount.approvalStatus !== 'APPROVED') {
          return sum;
        }
        if (discount.type === 'PERCENTAGE') {
          return sum + (subtotal * discount.value) / 100;
        }
        return sum + discount.value;
      }, 0);
      const grandTotal = Math.max(subtotal - discountTotal, 0);
      const paidAmount = order.payments
        .filter((payment) => payment.status !== 'CANCELLED')
        .reduce((sum, payment) => sum + (payment.amount - payment.refundedAmount), 0);

      const financialStatus: OrderFinancialStatus =
        order.status === OrderStatus.CANCELLED
          ? 'CANCELLED'
          : order.payments.some((payment) => payment.status === 'REFUNDED')
            ? 'REFUNDED'
            : order.payments.length === 0
              ? 'UNPAID'
              : order.payments.some((payment) => payment.remainingAmount > 0)
                ? 'PARTIALLY_PAID'
                : 'PAID';

      return {
        id: order.id,
        dailyOrderNumber: order.dailyOrderNumber,
        status: order.status,
        grandTotal,
        paidAmount,
        remainingAmount: Math.max(grandTotal - paidAmount, 0),
        financialStatus,
        tableLabel: order.table ? `Table ${order.table.number}` : 'Takeaway',
        createdAt: order.createdAt.toISOString(),
      };
    });
  }

  private async sumRevenue(restaurantId: string, start: Date) {
    const aggregate = await this.prisma.order.aggregate({
      where: {
        restaurantId,
        status: OrderStatus.PAID,
        createdAt: {
          gte: start,
        },
      },
      _sum: {
        total: true,
      },
    });

    return aggregate._sum.total ?? 0;
  }
}
