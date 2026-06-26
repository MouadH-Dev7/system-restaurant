import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { PrintingModule } from '../modules/printing/printing.module';
import { ReportsModule } from '../modules/reports/reports.module';
import { SystemModule } from '../modules/system/system.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { QueueModule } from './queue.module';
import { AnalyticsWorkerService } from './workers/analytics-worker.service';
import { BackupWorkerService } from './workers/backup-worker.service';
import { ExportWorkerService } from './workers/export-worker.service';
import { NotificationWorkerService } from './workers/notification-worker.service';
import { PrintingWorkerService } from './workers/printing-worker.service';

@Module({
  imports: [QueueModule, PrintingModule, RealtimeModule, AnalyticsModule, ReportsModule, SystemModule],
  providers: [
    PrintingWorkerService,
    NotificationWorkerService,
    AnalyticsWorkerService,
    ExportWorkerService,
    BackupWorkerService,
  ],
})
export class WorkerModule {}
