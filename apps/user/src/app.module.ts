import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';

import { LoggerModule, TraceInterceptor } from '@repo/logger';
import { AppConfigModule } from '@repo/config/env';
import { GRPC_SERVICE } from '@repo/config/grpc';
import { GrpcHealthModule } from '@repo/config/health';
import { GlobalGrpcExceptionFilter } from '@repo/errors';

import { AppController } from './app.controller';
import { UserModule } from './domains/user';
import { AppZodValidationPipe } from './common/pipe/dto.filter';

// ----------------------------------------------------------------------------

@Module({
  imports: [
    AppConfigModule.forRoot({
      appType: 'grpc',
    }),

    LoggerModule.forRoot({
      serviceName: GRPC_SERVICE.USER,
      fileLog: {
        enabled: process.env.NODE_ENV !== 'production',
      },
    }),

    GrpcHealthModule,

    // Feature Modules
    UserModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalGrpcExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: AppZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TraceInterceptor,
    },
  ],
})
export class AppModule {}
