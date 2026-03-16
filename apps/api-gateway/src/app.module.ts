import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { ZodValidationPipe } from 'nestjs-zod';
// pcakcage
import { LoggerModule, TraceInterceptor } from '@repo/logger';
import { GrpcModule } from '@repo/transport/grpc';
import { GlobalHttpExceptionFilter } from '@repo/errors';
import {
  AppConfigModule,
  COMMON_CONFIG,
  type CommonConfigType,
} from '@repo/config';
import { AuthModule } from '@repo/security/auth';

import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { UserModule } from '@/modules/user/user.module';
import { GatewayHealthModule } from './common/health/health.module';

// ----------------------------------------------------------------------------

@Module({
  imports: [
    AppConfigModule.forRoot({
      appType: 'api',
    }),

    LoggerModule.forRoot({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      serviceName: 'API_GATEWAY',
      fileLog: {
        enabled: process.env.NODE_ENV !== 'production',
      },
    }),

    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
      port: 30001,
    }),

    AuthModule.forRootAsync({
      inject: [COMMON_CONFIG.KEY],
      useFactory: (commonConfig: CommonConfigType) => ({
        secret: commonConfig.JWT_SECRET,
        expiresIn: commonConfig.JWT_EXPIRES_IN,
      }),
    }),

    GrpcModule,
    GatewayHealthModule,

    // Feature Modules
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TraceInterceptor,
    },
  ],
})
export class AppModule {}
