import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventoryConsumptionLogsController } from './inventory-consumption-logs.controller';
import { InventoryConsumptionLogsService } from './inventory-consumption-logs.service';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryConsumptionLogsController],
  providers: [InventoryConsumptionLogsService],
  exports: [InventoryConsumptionLogsService],
})
export class InventoryConsumptionLogsModule {}
