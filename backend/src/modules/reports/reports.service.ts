import { mkdir, writeFile } from 'fs/promises';
import { Injectable, NotFoundException } from '@nestjs/common';
import { QueueName, ReportStatus, type Prisma, type ReportType } from '@prisma/client';
import type { CreateReportExportJobInput, ReportExportJobDTO } from '@repo/shared-types';
import { EXPORT_QUEUE_JOBS } from '../../queue/queue.constants';
import { resolveStoragePath } from '../../queue/queue-storage.util';
import { QueueService } from '../../queue/queue.service';
import type { ExportQueuePayload } from '../../queue/queue.types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async list(restaurantId: string): Promise<ReportExportJobDTO[]> {
    const jobs = await this.prisma.reportExportJob.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return jobs.map((job) => this.toDto(job));
  }

  async create(input: CreateReportExportJobInput): Promise<ReportExportJobDTO> {
    const rangeStart = new Date(input.rangeStart);
    const rangeEnd = new Date(input.rangeEnd);

    const rowCount = await this.resolveRowCount(
      input.restaurantId,
      input.type,
      rangeStart,
      rangeEnd,
    );

    const job = await this.prisma.reportExportJob.create({
      data: {
        restaurantId: input.restaurantId,
        type: input.type,
        name: input.name.trim(),
        format: input.format,
        rangeStart,
        rangeEnd,
        rowCount,
        status: ReportStatus.PENDING,
      },
    });

    const queueJob = this.resolveQueueJob(input.type);
    const enqueued = await this.queueService.enqueue({
      queueName: QueueName.EXPORTS,
      jobType: queueJob.type,
      jobName: queueJob.name,
      payload: {
        reportJobId: job.id,
        restaurantId: input.restaurantId,
        type: input.type,
        format: input.format,
        name: input.name.trim(),
        rangeStart: input.rangeStart,
        rangeEnd: input.rangeEnd,
      } satisfies ExportQueuePayload,
      restaurantId: input.restaurantId,
    });

    const queuedJob = await this.prisma.reportExportJob.update({
      where: { id: job.id },
      data: {
        queueJobId: enqueued.queueJob.id,
      },
    });

    return this.toDto(queuedJob);
  }

  async processExportJob(reportJobId: string) {
    const job = await this.prisma.reportExportJob.findUnique({
      where: { id: reportJobId },
    });

    if (!job) {
      throw new NotFoundException(`Report export job ${reportJobId} not found`);
    }

    await this.prisma.reportExportJob.update({
      where: { id: job.id },
      data: {
        status: ReportStatus.PROCESSING,
        startedAt: new Date(),
        errorMessage: null,
        failedAt: null,
      },
    });

    try {
      const rows = await this.buildRows(job.restaurantId, job.type, job.rangeStart, job.rangeEnd);
      const filePath = await this.writeExportFile({
        restaurantId: job.restaurantId,
        reportJobId: job.id,
        name: job.name,
        format: job.format as 'CSV' | 'JSON',
        rows,
      });

      await this.prisma.reportExportJob.update({
        where: { id: job.id },
        data: {
          status: ReportStatus.COMPLETED,
          rowCount: rows.length,
          filePath,
          completedAt: new Date(),
        },
      });

      return filePath;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export processing failed';
      await this.prisma.reportExportJob.update({
        where: { id: job.id },
        data: {
          status: ReportStatus.FAILED,
          errorMessage: message,
          failedAt: new Date(),
        },
      });
      throw error;
    }
  }

  private async resolveRowCount(
    restaurantId: string,
    type: CreateReportExportJobInput['type'],
    start: Date,
    end: Date,
  ) {
    if (type === 'PAYMENTS') {
      return this.prisma.payment.count({
        where: {
          order: { restaurantId },
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });
    }

    if (type === 'DISCOUNTS') {
      return this.prisma.discount.count({
        where: {
          order: { restaurantId },
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });
    }

    if (type === 'FINANCIAL_AUDIT') {
      return this.prisma.auditLog.count({
        where: {
          restaurantId,
          createdAt: {
            gte: start,
            lte: end,
          },
          action: {
            in: [
              'PAYMENT_CREATED',
              'PAYMENT_UPDATED',
              'PAYMENT_CANCELLED',
              'PAYMENT_REFUNDED',
              'PAYMENT_METHOD_CHANGED',
              'DISCOUNT_ADDED',
              'DISCOUNT_UPDATED',
              'DISCOUNT_REMOVED',
              'DISCOUNT_APPROVED',
              'DISCOUNT_REJECTED',
            ],
          },
        },
      });
    }

    if (type === 'PRINTING') {
      return this.prisma.printJob.count({
        where: {
          restaurantId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });
    }

    if (type === 'CUSTOMERS') {
      return this.prisma.customerProfile.count({
        where: { restaurantId },
      });
    }

    return this.prisma.order.count({
      where: {
        restaurantId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });
  }

  private toDto(job: {
    id: string;
    restaurantId: string;
    type: ReportExportJobDTO['type'];
    name: string;
    status: ReportExportJobDTO['status'];
    format: string;
    filePath?: string | null;
    errorMessage?: string | null;
    rangeStart: Date;
    rangeEnd: Date;
    rowCount: number;
    startedAt?: Date | null;
    createdAt: Date;
    completedAt: Date | null;
    failedAt?: Date | null;
  }): ReportExportJobDTO {
    return {
      id: job.id,
      restaurantId: job.restaurantId,
      type: job.type,
      name: job.name,
      status: job.status,
      format: job.format as ReportExportJobDTO['format'],
      filePath: job.filePath ?? null,
      errorMessage: job.errorMessage ?? null,
      rangeStart: job.rangeStart.toISOString(),
      rangeEnd: job.rangeEnd.toISOString(),
      rowCount: job.rowCount,
      startedAt: job.startedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null,
      failedAt: job.failedAt?.toISOString() ?? null,
    };
  }

  private resolveQueueJob(type: CreateReportExportJobInput['type']) {
    switch (type) {
      case 'INVENTORY':
        return EXPORT_QUEUE_JOBS.INVENTORY;
      case 'CUSTOMERS':
        return EXPORT_QUEUE_JOBS.CUSTOMERS;
      default:
        return EXPORT_QUEUE_JOBS.SALES_REPORT;
    }
  }

  private async buildRows(
    restaurantId: string,
    type: ReportType,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<Record<string, unknown>[]> {
    switch (type) {
      case 'PRINTING': {
        const jobs = await this.prisma.printJob.findMany({
          where: {
            restaurantId,
            createdAt: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        return jobs.map((job) => ({
          id: job.id,
          jobId: job.jobId,
          type: job.type,
          printerName: job.printerName,
          status: job.status,
          attempts: job.attempts,
          failedReason: job.failedReason,
          createdAt: job.createdAt.toISOString(),
          processedAt: job.processedAt?.toISOString() ?? null,
        }));
      }
      case 'INVENTORY': {
        const items = await this.prisma.inventoryItem.findMany({
          where: { restaurantId },
          orderBy: { name: 'asc' },
        });

        return items.map((item) => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          stockLevel: item.stockLevel,
          minAlertLevel: item.minAlertLevel,
          unitPrice: item.unitPrice,
          supplier: item.supplier,
          status: item.status,
          updatedAt: item.updatedAt.toISOString(),
        }));
      }
      case 'CUSTOMERS': {
        const customers = await this.prisma.customerProfile.findMany({
          where: { restaurantId },
          orderBy: { createdAt: 'asc' },
        });

        return customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          tier: customer.tier,
          totalOrders: customer.totalOrders,
          totalSpent: customer.totalSpent,
          lastVisitAt: customer.lastVisitAt?.toISOString() ?? null,
        }));
      }
      case 'PAYMENTS': {
        const payments = await this.prisma.payment.findMany({
          where: {
            order: {
              restaurantId,
            },
            createdAt: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
          include: {
            order: {
              select: {
                dailyOrderNumber: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        return payments.map((payment) => ({
          paymentId: payment.id,
          orderId: payment.orderId,
          dailyOrderNumber: payment.order.dailyOrderNumber,
          amount: payment.amount,
          refundedAmount: payment.refundedAmount,
          netAmount: payment.amount - payment.refundedAmount,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
          createdBy: payment.createdBy,
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
        }));
      }
      case 'DISCOUNTS': {
        const discounts = await this.prisma.discount.findMany({
          where: {
            order: {
              restaurantId,
            },
            createdAt: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
          include: {
            order: {
              select: {
                dailyOrderNumber: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        return discounts.map((discount) => ({
          discountId: discount.id,
          orderId: discount.orderId,
          dailyOrderNumber: discount.order.dailyOrderNumber,
          type: discount.type,
          value: discount.value,
          reason: discount.reason,
          approvalStatus: discount.approvalStatus,
          createdBy: discount.createdBy,
          approvedBy: discount.approvedBy,
          createdAt: discount.createdAt.toISOString(),
        }));
      }
      case 'FINANCIAL_AUDIT': {
        const logs = await this.prisma.auditLog.findMany({
          where: {
            restaurantId,
            createdAt: {
              gte: rangeStart,
              lte: rangeEnd,
            },
            action: {
              in: [
                'PAYMENT_CREATED',
                'PAYMENT_UPDATED',
                'PAYMENT_CANCELLED',
                'PAYMENT_REFUNDED',
                'PAYMENT_METHOD_CHANGED',
                'DISCOUNT_ADDED',
                'DISCOUNT_UPDATED',
                'DISCOUNT_REMOVED',
                'DISCOUNT_APPROVED',
                'DISCOUNT_REJECTED',
              ],
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        return logs.map((log) => {
          const details = this.toAuditDetails(log.details);

          return {
            id: log.id,
            action: log.action,
            userName: log.userName,
            role: log.role,
            entityType: details.entityType ?? null,
            entityId: details.entityId ?? null,
            details: log.details,
            reason: details.reason ?? null,
            riskFlags: Array.isArray(details.riskFlags) ? details.riskFlags : [],
            createdAt: log.createdAt.toISOString(),
          };
        });
      }
      case 'FINANCIAL':
      case 'OPERATIONS': {
        const orders = await this.prisma.order.findMany({
          where: {
            restaurantId,
            createdAt: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
          include: {
            table: true,
            items: true,
            payments: true,
            discounts: true,
          },
          orderBy: { createdAt: 'asc' },
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

          return {
            id: order.id,
            dailyOrderNumber: order.dailyOrderNumber,
            status: order.status,
            orderType: order.orderType,
            grandTotal,
            paidAmount,
            refundsAmount: order.payments.reduce((sum, payment) => sum + payment.refundedAmount, 0),
            discountsCount: order.discounts.length,
            itemCount: order.items.length,
            tableNumber: order.table?.number ?? null,
            createdAt: order.createdAt.toISOString(),
            lastModifiedAt: order.lastModifiedAt.toISOString(),
          };
        });
      }
    }
  }

  private async writeExportFile(input: {
    restaurantId: string;
    reportJobId: string;
    name: string;
    format: 'CSV' | 'JSON';
    rows: Record<string, unknown>[];
  }) {
    const directory = resolveStoragePath('exports', input.restaurantId);
    await mkdir(directory, { recursive: true });

    const sanitizedName = input.name
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    const filePath = resolveStoragePath(
      'exports',
      input.restaurantId,
      `${sanitizedName || 'report'}-${input.reportJobId}.${input.format.toLowerCase()}`,
    );

    const content =
      input.format === 'JSON' ? JSON.stringify(input.rows, null, 2) : this.toCsv(input.rows);

    await writeFile(filePath, content, 'utf8');
    return filePath;
  }

  private toAuditDetails(details: Prisma.JsonValue): Record<string, unknown> {
    if (!details || typeof details !== 'object' || Array.isArray(details)) {
      return {};
    }

    return details as Record<string, unknown>;
  }

  private toCsv(rows: Record<string, unknown>[]) {
    if (rows.length === 0) {
      return '';
    }

    const firstRow = rows[0] ?? {};
    const headers = Object.keys(firstRow);
    const encode = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    return [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => encode(row[header])).join(',')),
    ].join('\n');
  }
}
