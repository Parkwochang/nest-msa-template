import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
// pcakcage
import { LoggerModule, TraceInterceptor } from '@repo/logger';
import {
  ConfigModule,
  COMMON_CONFIG,
  type CommonConfigType,
} from '@repo/config/env';
import { AuthModule } from '@repo/config/auth';
import {
  createGrpcClientConfig,
  GRPC_PACKAGE,
  GRPC_SERVICE,
  GrpcModule,
} from '@repo/config/grpc';
import { HealthModule } from '@repo/config/health';
import { PROTO_PATHS } from '@repo/proto';

import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { UserModule } from '@/user/user.module';

// ----------------------------------------------------------------------------

@Module({
  imports: [
    ConfigModule.forRoot({
      appType: 'api',
    }),
    LoggerModule.forRoot({
      serviceName: 'API_GATEWAY',
      disableFileLog: process.env.NODE_ENV === 'production',
    }),

    AuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const commonConfig = configService.get<CommonConfigType>(
          COMMON_CONFIG.KEY,
        );

        if (!commonConfig) {
          throw new Error('Common config is required');
        }

        return {
          secret: commonConfig.JWT_SECRET,
          expiresIn: commonConfig.JWT_EXPIRES_IN,
        };
      },
    }),

    GrpcModule.registerAsync([
      createGrpcClientConfig(GRPC_SERVICE.USER, (config) => ({
        url: config.USER_GRPC_URL,
        package: GRPC_PACKAGE.USER,
        protoPath: PROTO_PATHS.USER,
      })),
      createGrpcClientConfig(GRPC_SERVICE.ORDER, (config) => ({
        url: config.ORDER_GRPC_URL,
        package: GRPC_PACKAGE.ORDER,
        protoPath: PROTO_PATHS.ORDER,
      })),
    ]),

    // Feature Modules
    UserModule,
    HealthModule,
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
