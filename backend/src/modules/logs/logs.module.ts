import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditTrailService } from './audit-trail.service';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

@Module({
  imports: [PrismaModule],
  controllers: [LogsController],
  providers: [LogsService, AuditTrailService],
  exports: [LogsService, AuditTrailService],
})
export class LogsModule {}
