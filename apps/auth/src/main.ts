import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type ConfigType } from '@nestjs/config';

import { PROTO_PATHS } from '@repo/proto';
import { WINSTON_MODULE_NEST_PROVIDER } from '@repo/logger';
import { connectGrpcServer, GRPC_PACKAGE } from '@repo/config/grpc';
import { APP_CONFIG } from '@repo/config/env';
import { GlobalGrpcExceptionFilter } from '@repo/errors';

import { AppModule } from './app.module';

// ----------------------------------------------------------------------------

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get<ConfigType<typeof APP_CONFIG>>(APP_CONFIG.KEY);

  if (!appConfig) {
    throw new Error('APP_CONFIG is required');
  }

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const grpcMicroservice = app.connectMicroservice(
    connectGrpcServer({
      url: appConfig.GRPC_URL,
      protoPath: PROTO_PATHS.USER,
      package: GRPC_PACKAGE.USER,
    }),
  );
  grpcMicroservice.useGlobalFilters(new GlobalGrpcExceptionFilter());

  await app.startAllMicroservices();

  Logger.log(`✅ gRPC Server is running on: ${appConfig.GRPC_URL}`);

  await app.listen(appConfig.HTTP_PORT);

  Logger.log(`🚀 HTTP Server is running port: ${appConfig.HTTP_PORT}`);
}

bootstrap();
