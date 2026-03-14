import { Module } from '@nestjs/common';

import { HealthModule } from '@repo/health';

import { GatewayHealthController } from './health.controller';

/**
 * Health Check Module
 * @description Kubernetes liveness/readiness probe용 모듈
 */
@Module({
  imports: [HealthModule],
  controllers: [GatewayHealthController],
})
export class GatewayHealthModule {}
