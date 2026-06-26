import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { QueueService } from './queue.service';
import { FailedPrintJobsService } from './failed-print-jobs.service';

@Global()
@Module({
  imports: [PrismaModule, RedisModule],
  providers: [QueueService, FailedPrintJobsService],
  exports: [QueueService, FailedPrintJobsService],
})
export class QueueModule {}
