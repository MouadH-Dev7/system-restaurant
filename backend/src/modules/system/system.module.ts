import { Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueueModule } from '../../queue/queue.module';
import { RedisModule } from '../../redis/redis.module';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';

@Module({
  imports: [PrismaModule, RedisModule, RealtimeModule, QueueModule],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
