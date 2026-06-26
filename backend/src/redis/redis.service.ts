import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { type RedisOptions } from 'ioredis';

type MessageHandler = (message: string) => void;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private publisher!: Redis;
  private subscriber!: Redis;
  private readonly handlers = new Map<string, Set<MessageHandler>>();

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.publisher = this.createClient('publisher');
    this.subscriber = this.createClient('subscriber');

    this.subscriber.on('message', (channel, message) => {
      const channelHandlers = this.handlers.get(channel);
      if (!channelHandlers) {
        return;
      }

      for (const handler of channelHandlers) {
        handler(message);
      }
    });
  }

  async onModuleDestroy() {
    await Promise.all([this.publisher?.quit(), this.subscriber?.quit()]);
  }

  async publish(channel: string, message: string) {
    await this.publisher.publish(channel, message);
  }

  async get(key: string) {
    return this.publisher.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.publisher.set(key, value, 'EX', ttlSeconds);
      return;
    }

    await this.publisher.set(key, value);
  }

  async del(key: string) {
    await this.publisher.del(key);
  }

  async subscribe(channel: string, handler: MessageHandler) {
    const existing = this.handlers.get(channel);
    if (existing) {
      existing.add(handler);
      return;
    }

    this.handlers.set(channel, new Set([handler]));
    await this.subscriber.subscribe(channel);
  }

  createClient(connectionName?: string) {
    return new Redis(this.getConnectionOptions(connectionName));
  }

  getConnectionOptions(connectionName?: string): RedisOptions {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('REDIS_URL is not configured');
    }

    const parsed = new URL(redisUrl);
    const db = parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) : 0;

    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      db: Number.isFinite(db) ? db : 0,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
      connectionName,
      maxRetriesPerRequest: null,
    };
  }
}
