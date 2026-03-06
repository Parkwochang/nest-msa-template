import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DevtoolsModule } from '@nestjs/devtools-integration';
// pcakcage
import { LoggerModule, TraceInterceptor } from '@repo/logger';
import {
  AppConfigModule,
  COMMON_CONFIG,
  type CommonConfigType,
} from '@repo/config/env';
import { AuthModule } from '@repo/config/auth';

import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { UserModule } from '@/modules/user/user.module';
import { GatewayHealthModule } from './common/health/health.module';
import { GrpcModule } from '@repo/transport/grpc';

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
      provide: APP_INTERCEPTOR,
      useClass: TraceInterceptor,
    },
  ],
})
export class AppModule {}
