import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { AppLogger } from '@repo/logger';
import { APP_CONFIG, AppConfigType } from '@repo/config/env';

import { PrismaClient, Prisma } from './generated/client';

// ----------------------------------------------------------------------------

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor(
    @Inject(APP_CONFIG.KEY) private readonly appConfig: AppConfigType,
    private readonly logger: AppLogger,
  ) {
    const pool = new Pool({
      connectionString: appConfig.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
      ],
    });

    // 클래스 상속 초기화 순서 보장을 위해 super 호출 후 pool 할당 (부모 클래스 prisma client 초기화 후 실행)
    this.logger.setContext(PrismaService.name);
    this.pool = pool;
  }

  async onModuleInit() {
    if (this.appConfig.NODE_ENV !== 'production') {
      (this as PrismaClient<Prisma.LogLevel>).$on(
        'query',
        (event: Prisma.QueryEvent) => {
          this.logger.verbose(event.query, { duration: event.duration });
        },
      );
    }

    (this as PrismaClient<Prisma.LogLevel>).$on(
      'error',
      (event: Prisma.LogEvent) => {
        this.logger.verbose(event.target);
      },
    );

    await this.$connect().then(() => {
      this.logger.info('Prisma connected');
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
