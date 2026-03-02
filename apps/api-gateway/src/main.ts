import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';

import { WINSTON_MODULE_NEST_PROVIDER } from '@repo/logger';
import { GATEWAY_CONFIG, type GatewayConfigType } from '@repo/config/env';
import { GlobalHttpExceptionFilter } from '@repo/errors';

import { AppModule } from './app.module';

// ----------------------------------------------------------------------------

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
    // abortOnError: false,
  });

  const gatewayConfig = app.get<GatewayConfigType>(GATEWAY_CONFIG.KEY);

  // Winston을 NestJS 기본 로거로 설정
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // CORS 설정
  app.enableCors({
    // origin: ['http://localhost:3000', 'domain'],
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    maxAge: 86400,
    // credentials: true,
  });

  // 버전 관리 설정
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 에러 필터 등록
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  await app.listen(gatewayConfig.HTTP_PORT);

  console.log(
    `🚀 Application is running on: http://localhost:${gatewayConfig.HTTP_PORT}`,
  );
}
bootstrap();
