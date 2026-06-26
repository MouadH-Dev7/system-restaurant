import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreatePrinterConfigInput,
  PrinterConfigDTO,
  PrintJobDTO,
  UpdatePrinterConfigInput,
} from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { PrintingService } from '../printing/printing.service';

@Injectable()
export class PrintersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly printingService: PrintingService,
  ) {}

  async list(restaurantId: string): Promise<PrinterConfigDTO[]> {
    const printers = await this.prisma.printerConfig.findMany({
      where: { restaurantId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return printers.map((printer) => this.toDto(printer));
  }

  async create(input: CreatePrinterConfigInput): Promise<PrinterConfigDTO> {
    const printer = await this.prisma.printerConfig.create({
      data: {
        restaurantId: input.restaurantId,
        name: input.name.trim(),
        ipAddress: input.ipAddress.trim(),
        port: input.port,
        type: input.type,
        status: input.status ?? 'ONLINE',
      },
    });

    return this.toDto(printer);
  }

  async update(
    id: string,
    restaurantId: string,
    input: UpdatePrinterConfigInput,
  ): Promise<PrinterConfigDTO> {
    const existing = await this.prisma.printerConfig.findFirst({ where: { id, restaurantId } });
    if (!existing) {
      throw new NotFoundException('Printer not found');
    }

    const printer = await this.prisma.printerConfig.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.ipAddress !== undefined ? { ipAddress: input.ipAddress.trim() } : {}),
        ...(input.port !== undefined ? { port: input.port } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    return this.toDto(printer);
  }

  async history(restaurantId: string): Promise<PrintJobDTO[]> {
    const jobs = await this.prisma.printJob.findMany({
      where: {
        restaurantId,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return jobs.map((job) => ({
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
    }));
  }

  async printTest(restaurantId: string, printerName?: string) {
    return this.printingService.printTest(restaurantId, printerName);
  }

  private toDto(printer: {
    id: string;
    name: string;
    ipAddress: string;
    port: number;
    type: PrinterConfigDTO['type'];
    status: PrinterConfigDTO['status'];
    restaurantId: string;
    createdAt: Date;
    updatedAt: Date;
  }): PrinterConfigDTO {
    return {
      id: printer.id,
      name: printer.name,
      ipAddress: printer.ipAddress,
      port: printer.port,
      type: printer.type,
      status: printer.status,
      restaurantId: printer.restaurantId,
      createdAt: printer.createdAt.toISOString(),
      updatedAt: printer.updatedAt.toISOString(),
    };
  }
}
