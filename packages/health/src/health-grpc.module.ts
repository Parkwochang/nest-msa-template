import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthService } from './health.service';
import { GrpcHealthController } from './health-grpc.controller';

// ----------------------------------------------------------------------------

/**
 * Health Check Module
 * @description Kubernetes liveness/readiness probe용 모듈
 */
@Module({
  imports: [
    TerminusModule.forRoot({
      gracefulShutdownTimeoutMs: 1000,
    }),
  ],
  controllers: [GrpcHealthController],
  providers: [HealthService],
})
export class GrpcHealthModule {}
