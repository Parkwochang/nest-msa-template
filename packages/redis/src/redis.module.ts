import Redis from 'ioredis';
import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { COMMON_CONFIG, type CommonConfigType } from '@repo/config/env';

import { RedisService } from './redis.service';
import { REDIS_CACHE } from './redis.constants';

// ----------------------------------------------------------------------------

@Module({})
export class RedisModule {
  static forRootAsync(): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      imports: [ConfigModule],
      providers: [
        {
          provide: REDIS_CACHE,
          useFactory: (commonConfig: CommonConfigType) => {
            return new Redis({
              host: commonConfig.REDIS_HOST,
              port: commonConfig.REDIS_PORT,
              connectTimeout: 5000,
            });
          },
          inject: [COMMON_CONFIG.KEY],
        },
        RedisService,
      ],
      exports: [RedisService],
    };
  }
}
