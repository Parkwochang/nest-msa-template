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
import { HealthModule } from '@repo/config/health';

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
      serviceName: 'API_GATEWAY',
      disableFileLog: process.env.NODE_ENV === 'production',
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

    // Feature Modules
    GatewayHealthModule,
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
