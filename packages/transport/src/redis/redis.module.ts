import Redis from 'ioredis';
import { Module, DynamicModule } from '@nestjs/common';

import { REDIS_CONFIG, RedisConfigType } from '@repo/config';

import { RedisService } from './redis.service';
import { REDIS_CACHE } from './redis.constants';

// ----------------------------------------------------------------------------

@Module({})
export class RedisModule {
  static forRootAsync(): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      providers: [
        {
          provide: REDIS_CACHE,
          useFactory: (redisConfig: RedisConfigType) => {
            return new Redis({
              host: redisConfig.REDIS_HOST,
              port: redisConfig.REDIS_PORT,
              password: redisConfig.REDIS_PASSWORD,
              db: redisConfig.REDIS_DB,
              connectTimeout: redisConfig.REDIS_CONNECT_TIMEOUT,
              keyPrefix: redisConfig.REDIS_KEY_PREFIX,
            });
          },
          inject: [REDIS_CONFIG.KEY],
        },
        RedisService,
      ],
      exports: [RedisService],
    };
  }
}
