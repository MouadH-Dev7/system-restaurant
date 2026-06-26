import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueueModule } from '../../queue/queue.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { KitchenTicketBuilder } from './builders/kitchen-ticket.builder';
import { ReceiptBuilder } from './builders/receipt.builder';
import { EscPosService } from './esc-pos.service';
import { PrinterTransportService } from './printer-transport.service';
import { PrintingController } from './printing.controller';
import { PrintingService } from './printing.service';

@Module({
  imports: [PrismaModule, QueueModule, PaymentsModule, DiscountsModule, forwardRef(() => OrdersModule)],
  controllers: [PrintingController],
  providers: [
    PrintingService,
    EscPosService,
    PrinterTransportService,
    ReceiptBuilder,
    KitchenTicketBuilder,
  ],
  exports: [PrintingService, PrinterTransportService],
})
export class PrintingModule {}
