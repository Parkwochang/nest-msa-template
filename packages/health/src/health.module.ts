import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthService } from './health.service';

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
  providers: [HealthService],
  exports: [HealthService, TerminusModule],
})
export class HealthModule {}
