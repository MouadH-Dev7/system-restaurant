import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { WorkerModule } from './queue/worker.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { InventoryConsumptionLogsModule } from './modules/inventory-consumption-logs/inventory-consumption-logs.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MenuItemIngredientsModule } from './modules/menu-item-ingredients/menu-item-ingredients.module';
import { ModifierIngredientsModule } from './modules/modifier-ingredients/modifier-ingredients.module';
import { LogsModule } from './modules/logs/logs.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PrintingModule } from './modules/printing/printing.module';
import { PrintersModule } from './modules/printers/printers.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SupplierCategoryModule } from './modules/supplier-category/supplier-category.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { TablesModule } from './modules/tables/tables.module';
import { SystemModule } from './modules/system/system.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: (configService.get<number>('THROTTLE_TTL') ?? 60) * 1000,
          limit: configService.get<number>('THROTTLE_LIMIT') ?? 120,
        },
      ],
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    RealtimeModule,
    AuthModule,
    CustomersModule,
    DiscountsModule,
    InventoryConsumptionLogsModule,
    InventoryModule,
    LogsModule,
    MenuItemIngredientsModule,
    ModifierIngredientsModule,
    SettingsModule,
    SupplierCategoryModule,
    SuppliersModule,
    UsersModule,
    RestaurantsModule,
    TablesModule,
    MenuModule,
    OrdersModule,
    PrintingModule,
    PrintersModule,
    PaymentsModule,
    AnalyticsModule,
    ReportsModule,
    SystemModule,
    WorkerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
