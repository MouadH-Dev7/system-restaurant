import { forwardRef, Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { LogsModule } from '../logs/logs.module';
import { MenuModule } from '../menu/menu.module';
import { PaymentsModule } from '../payments/payments.module';
import { PrintingModule } from '../printing/printing.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { TablesModule } from '../tables/tables.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    RestaurantsModule,
    forwardRef(() => TablesModule),
    MenuModule,
    AnalyticsModule,
    PaymentsModule,
    DiscountsModule,
    LogsModule,
    RealtimeModule,
    forwardRef(() => PrintingModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
