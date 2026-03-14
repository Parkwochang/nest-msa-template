import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';

import { REDIS_CACHE } from './redis.constants';

// ----------------------------------------------------------------------------

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CACHE) private readonly redis: Redis) {
    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error', err.stack);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      this.logger.log('Redis reconnecting...');
    });
  }

  async onModuleInit() {
    try {
      await this.redis.ping();
      this.logger.log('Redis ping successful');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error('Redis ping failed', error.stack);
      }
    }
  }

  onModuleDestroy() {
    this.redis.quit();
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      return this.redis.set(key, value, 'EX', ttl);
    }
    return this.redis.set(key, value);
  }

  async del(key: string) {
    return this.redis.del(key);
  }

  async expire(key: string, ttl: number) {
    return this.redis.expire(key, ttl);
  }

  async ttl(key: string) {
    return this.redis.ttl(key);
  }

  async keys(pattern: string) {
    return this.redis.keys(pattern);
  }

  /**
   * 레디스 클라이언트 반환
   * lua 스크립트, zset 등 실행 시 사용
   * @returns Redis client
   */
  getClient() {
    return this.redis;
  }
}
