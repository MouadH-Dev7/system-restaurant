import { forwardRef, Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module';
import { LogsModule } from '../logs/logs.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { WaiterCallService } from './waiter-call.service';
import { WaiterNotificationsService } from './waiter-notifications.service';
import { TableOperationsService } from './table-operations.service';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [
    RestaurantsModule,
    RealtimeModule,
    LogsModule,
    forwardRef(() => OrdersModule),
    PaymentsModule,
    DiscountsModule,
  ],
  controllers: [TablesController],
  providers: [TablesService, WaiterCallService, WaiterNotificationsService, TableOperationsService],
  exports: [TablesService, WaiterCallService, WaiterNotificationsService, TableOperationsService],
})
export class TablesModule {}
