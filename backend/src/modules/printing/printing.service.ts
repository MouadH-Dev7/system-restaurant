import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { OrderResponse, PrintJobDTO, ReceiptLanguage } from '@repo/shared-types';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrintJobStatus, PrintJobType, QueueName } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountsService } from '../discounts/discounts.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { generateOrderModificationTicket } from './builders/order-modification-ticket';
import { KitchenTicketBuilder } from './builders/kitchen-ticket.builder';
import { ReceiptBuilder } from './builders/receipt.builder';
import { EscPosService } from './esc-pos.service';
import { QueueService } from '../../queue/queue.service';
import { PRINT_QUEUE_JOBS } from '../../queue/queue.constants';
import type { PrintQueuePayload } from '../../queue/queue.types';

@Injectable()
export class PrintingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly queueService: QueueService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
    private readonly discountsService: DiscountsService,
    private readonly escPos: EscPosService,
    private readonly receiptBuilder: ReceiptBuilder,
    private readonly kitchenTicketBuilder: KitchenTicketBuilder,
  ) {}

  async printReceipt(
    orderId: string,
    restaurantId: string,
    language: ReceiptLanguage,
    printerName?: string,
  ): Promise<PrintJobDTO> {
    const order = await this.ordersService.getOrderById(orderId, restaurantId);
    const document = await this.buildReceiptDocument(order, language ?? 'ar');

    return this.enqueuePreparedPrintJob({
      order,
      printerName,
      type: PrintJobType.RECEIPT,
      payloadType: 'RECEIPT',
      document,
    });
  }

  async printKitchenTicket(
    orderId: string,
    restaurantId: string,
    printerName?: string,
  ): Promise<PrintJobDTO | null> {
    const order = await this.ordersService.getOrderById(orderId, restaurantId);
    return this.enqueueKitchenPrintJob(order, printerName);
  }

  async printKitchenTicketForOrder(
    order: OrderResponse,
    printerName?: string,
  ): Promise<PrintJobDTO | null> {
    return this.enqueueKitchenPrintJob(order, printerName);
  }

  async printKitchenModificationTicket(
    previousOrder: OrderResponse,
    updatedOrder: OrderResponse,
    printerName?: string,
  ) {
    if (!(await this.isKitchenPrintingEnabled(updatedOrder.restaurantId))) {
      return null;
    }

    const document = generateOrderModificationTicket(previousOrder, updatedOrder);
    if (!document) {
      return null;
    }

    return this.enqueuePreparedPrintJob({
      order: updatedOrder,
      printerName,
      type: PrintJobType.ORDER_UPDATE_TICKET,
      payloadType: 'ORDER_UPDATE_TICKET',
      document,
    });
  }

  async printTest(restaurantId: string, printerName?: string) {
    const document = {
      title: 'PRINTER TEST',
      lines: [restaurantId, 'Thermal printer connectivity OK'],
    };

    return this.enqueuePreparedPrintJob({
      order: null,
      restaurantId,
      printerName,
      type: PrintJobType.TEST_PAGE,
      payloadType: 'TEST_PAGE',
      document,
    });
  }

  async listFailedJobs(restaurantId?: string) {
    return this.prisma.failedPrintJob.findMany({
      where: restaurantId ? { restaurantId } : undefined,
      orderBy: { failedAt: 'desc' },
    });
  }

  async getPrintJob(jobId: string) {
    const job = await this.prisma.printJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Print job not found');
    }

    return this.toPrintJobDto(job);
  }

  private async enqueueKitchenPrintJob(
    order: OrderResponse,
    printerName?: string,
  ): Promise<PrintJobDTO | null> {
    if (!(await this.isKitchenPrintingEnabled(order.restaurantId))) {
      return null;
    }

    const document = this.kitchenTicketBuilder.build(order);

    return this.enqueuePreparedPrintJob({
      order,
      printerName,
      type: PrintJobType.KITCHEN_TICKET,
      payloadType: 'KITCHEN_TICKET',
      document,
    });
  }

  private async isKitchenPrintingEnabled(restaurantId: string) {
    try {
      const settings = await this.prisma.restaurantSettings.findUnique({
        where: { restaurantId },
        select: { kitchenPrintingEnabled: true },
      });

      return settings?.kitchenPrintingEnabled ?? true;
    } catch (error) {
      if (this.isLegacyKitchenPrintingColumnIssue(error)) {
        return true;
      }

      throw error;
    }
  }

  private async buildReceiptDocument(order: OrderResponse, language: ReceiptLanguage) {
    const settings = await this.prisma.restaurantSettings.findUnique({
      where: { restaurantId: order.restaurantId },
    });
    const payments = await this.paymentsService.listByOrderInternal(order.id, order.restaurantId);
    const discounts = await this.discountsService.listByOrderInternal(order.id, order.restaurantId);

    return this.receiptBuilder.build(order, {
      restaurantName:
        settings?.restaurantName ||
        this.config.get<string>('RESTAURANT_PRINT_NAME') ||
        'Restaurant',
      restaurantAddress: settings?.businessAddress ?? null,
      restaurantPhone: settings?.contactPhone ?? null,
      restaurantEmail: settings?.contactEmail ?? null,
      footerMessage: settings?.receiptFooterMessage ?? null,
      currency: settings?.currency ?? 'DZD',
      paymentHistory: payments
        .filter((payment) => payment.status !== 'CANCELLED')
        .map((payment) => ({
          amount: Math.max(payment.amount - payment.refundedAmount, 0),
          paymentMethod: payment.paymentMethod,
        })),
      discounts,
      language,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      taxAmount: order.taxTotal,
      finalTotal: order.grandTotal,
      remainingAmount: order.remainingAmount,
      printedAt: new Date(),
      invoiceNumber: `${order.displayOrderId ?? order.dailyOrderNumber}-${new Date(order.createdAt).getTime()}`,
    });
  }

  private isLegacyKitchenPrintingColumnIssue(error: unknown) {
    const prismaError = error as { code?: string; message?: string } | null;

    return (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      typeof prismaError?.message === 'string'
    )
      ? (prismaError?.code === 'P2021' ||
          prismaError?.code === 'P2022' ||
          prismaError?.message?.includes('kitchenPrintingEnabled') === true)
      : false;
  }

  private async enqueuePreparedPrintJob(input: {
    order: OrderResponse | null;
    restaurantId?: string;
    printerName?: string;
    type: PrintJobType;
    payloadType: PrintQueuePayload['type'];
    document: { title: string; lines: string[] };
  }) {
    const restaurantId = input.restaurantId ?? input.order?.restaurantId;
    if (!restaurantId) {
      throw new BadRequestException('Restaurant is required for print jobs');
    }

    const printer = await this.resolvePrinter(restaurantId, input.type, input.printerName);
    if (!printer) {
      const printerLabel =
        input.type === PrintJobType.RECEIPT
          ? 'receipt'
          : input.type === PrintJobType.KITCHEN_TICKET || input.type === PrintJobType.ORDER_UPDATE_TICKET
            ? 'kitchen'
            : 'test';
      throw new BadRequestException(`No ${printerLabel} printer configured for this restaurant`);
    }
    const printerName = input.printerName ?? printer?.name ?? this.getDefaultPrinterName(input.type);

    const printJob = await this.prisma.printJob.create({
      data: {
        orderId: input.order?.id ?? null,
        restaurantId,
        printerId: printer?.id ?? null,
        type: input.type,
        printerName,
        status: PrintJobStatus.WAITING,
        attempts: 0,
        payload: {
          title: input.document.title,
          lines: input.document.lines,
        },
      },
    });

    const payload: PrintQueuePayload = {
      printJobId: printJob.id,
      restaurantId,
      printerName,
      printerId: printer?.id ?? null,
      orderId: input.order?.id ?? null,
      order: input.order,
      type: input.payloadType,
      document: input.document,
      rawDocument: this.escPos.buildDocument(input.document),
    };

    const queueMetadata = this.resolveQueueMetadata(input.payloadType);
    let enqueued;
    try {
      enqueued = await this.queueService.enqueue({
        queueName: QueueName.PRINTING,
        jobType: queueMetadata.type,
        jobName: queueMetadata.name,
        payload,
        restaurantId,
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : 'Printing queue unavailable',
      );
    }

    const updated = await this.prisma.printJob.update({
      where: { id: printJob.id },
      data: {
        jobId: enqueued.bullJobId,
        queueJobId: enqueued.queueJob.id,
      },
    });

    return this.toPrintJobDto(updated);
  }

  private async resolvePrinter(
    restaurantId: string,
    type: PrintJobType,
    printerName?: string,
  ) {
    if (printerName) {
      return this.prisma.printerConfig.findFirst({
        where: {
          restaurantId,
          name: printerName,
        },
      });
    }

    const printerType =
      type === PrintJobType.KITCHEN_TICKET || type === PrintJobType.ORDER_UPDATE_TICKET
        ? 'KITCHEN'
        : 'RECEIPT';

    return this.prisma.printerConfig.findFirst({
      where: {
        restaurantId,
        type: printerType,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private resolveQueueMetadata(type: PrintQueuePayload['type']) {
    switch (type) {
      case 'RECEIPT':
        return PRINT_QUEUE_JOBS.RECEIPT;
      case 'KITCHEN_TICKET':
        return PRINT_QUEUE_JOBS.KITCHEN_TICKET;
      case 'ORDER_UPDATE_TICKET':
        return PRINT_QUEUE_JOBS.ORDER_UPDATE_TICKET;
      case 'TEST_PAGE':
        return PRINT_QUEUE_JOBS.TEST_PAGE;
    }
  }

  private getDefaultPrinterName(type: PrintJobType) {
    if (type === PrintJobType.KITCHEN_TICKET || type === PrintJobType.ORDER_UPDATE_TICKET) {
      return this.config.get<string>('KITCHEN_PRINTER_NAME') ?? 'Kitchen Printer';
    }

    if (type === PrintJobType.RECEIPT) {
      return this.config.get<string>('RECEIPT_PRINTER_NAME') ?? 'Front Receipt Printer';
    }

    return this.config.get<string>('TEST_PRINTER_NAME') ?? 'Test Printer';
  }

  private toPrintJobDto(job: {
    id: string;
    jobId: string | null;
    orderId: string | null;
    restaurantId: string | null;
    printerId: string | null;
    type: PrintJobType;
    printerName: string;
    status: PrintJobStatus;
    attempts: number;
    payload: unknown;
    result: unknown;
    failedReason: string | null;
    errorMessage: string | null;
    processedAt: Date | null;
    printedAt: Date | null;
    createdAt: Date;
  }): PrintJobDTO {
    return {
      id: job.id,
      jobId: job.jobId,
      orderId: job.orderId,
      restaurantId: job.restaurantId,
      printerId: job.printerId,
      type: job.type,
      printerName: job.printerName,
      status: job.status,
      attempts: job.attempts,
      payload: job.payload,
      result: job.result,
      failedReason: job.failedReason,
      errorMessage: job.errorMessage,
      processedAt: job.processedAt?.toISOString() ?? null,
      printedAt: job.printedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
    };
  }
}
