import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { RedisModule } from '../redis/redis.module';
import { RealtimeGateway } from '../websocket/realtime.gateway';
import { OrderRealtimePublisher } from './order-realtime.publisher';

@Module({
  imports: [RedisModule, QueueModule],
  providers: [RealtimeGateway, OrderRealtimePublisher],
  exports: [OrderRealtimePublisher, RealtimeGateway],
})
export class RealtimeModule {}
