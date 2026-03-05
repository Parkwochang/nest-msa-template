import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type ConfigType } from '@nestjs/config';

import { PROTO_PATHS } from '@repo/proto';
import { WINSTON_MODULE_NEST_PROVIDER } from '@repo/logger';
import { connectGrpcServer } from '@repo/config/grpc';
import { GRPC_PACKAGE } from '@repo/config/grpc';
import { APP_CONFIG } from '@repo/config/env';

import { AppModule } from './app.module';

// ----------------------------------------------------------------------------

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appConfig = app.get<ConfigType<typeof APP_CONFIG>>(APP_CONFIG.KEY);

  if (!appConfig) {
    throw new Error('APP_CONFIG is required');
  }

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.connectMicroservice(
    connectGrpcServer({
      url: appConfig.GRPC_URL,
      protoPath: [PROTO_PATHS.USER, PROTO_PATHS.HEALTH],
      package: [GRPC_PACKAGE.USER, GRPC_PACKAGE.HEALTH],
    }),
    // 전역 모듈 사용시 앱 설정 상속 (global filter 등)
    { inheritAppConfig: true },
  );

  // gRPC 서버 시작
  await app.startAllMicroservices();

  Logger.log(`✅ gRPC Server is running on: ${appConfig.GRPC_URL}`);

  // hybrid http & grpc
  // await app.listen(appConfig.HTTP_PORT);

  // Logger.log(`🚀 HTTP Server is running port: ${appConfig.HTTP_PORT}`);
}

bootstrap();
