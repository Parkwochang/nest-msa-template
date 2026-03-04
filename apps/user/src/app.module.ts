import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { LoggerModule, TraceInterceptor } from '@repo/logger';
import { AppConfigModule } from '@repo/config/env';
// import { GrpcHealthModule } from '@repo/config/health';
import { GRPC_SERVICE } from '@repo/config/grpc';
import { GrpcHealthModule } from '@repo/config/health';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './domains/user';

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

// AuthModule.forRoot({
//   secret:
//     process.env.JWT_SECRET || 'default-secret-key-change-in-production',
//   expiresIn: '1h',
// }),
