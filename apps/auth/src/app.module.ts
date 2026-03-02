import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { LoggerModule, TraceInterceptor } from '@repo/logger';
import { AppConfigModule } from '@repo/config/env';
import { RedisModule } from '@repo/redis';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { InfraModule } from '@/infra/infra.module';

@Module({
  imports: [
    AppConfigModule.forRoot({
      appType: 'grpc',
    }),
    LoggerModule.forRoot({
      serviceName: 'AUTH_SERVICE',
      disableFileLog: process.env.NODE_ENV === 'production',
    }),
    RedisModule.forRootAsync(),
    InfraModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TraceInterceptor,
    },
  ],
})
export class AppModule {}
