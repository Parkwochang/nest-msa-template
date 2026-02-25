import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';

import { HealthService } from './health.service';

// ----------------------------------------------------------------------------

/**
 * Health Check Controller
 * @description Kubernetes liveness/readiness probe용 엔드포인트 제공
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly health: HealthCheckService,
  ) {}

  /**
   * Liveness Probe
   * @description 파드가 살아있는지 확인 (Kubernetes livenessProbe)
   * @example
   * GET /health/live
   */
  @Get('live')
  @HealthCheck()
  liveness() {
    return this.health.check([]);
  }

  /**
   * Readiness Probe
   * @description 파드가 트래픽을 받을 준비가 되었는지 확인 (Kubernetes readinessProbe)
   * @description API Gateway의 경우: 연결된 gRPC 서비스들의 연결 상태도 확인
   * @example
   * GET /health/ready
   */
  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      this.healthService.checkStorage,
      this.healthService.checkMemory,
      // API Gateway인 경우 gRPC 서비스 연결 상태 확인 (선택적)
      // this.healthService.checkUserService,
    ]);
  }

  /**
   * Health Check (일반)
   * @description 전체 health check
   * @description API Gateway의 경우: 연결된 gRPC 서비스들의 연결 상태도 확인
   * @example
   * GET /health
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      this.healthService.checkStorage,
      this.healthService.checkMemory,
      this.healthService.checkRSS,
      // API Gateway인 경우 gRPC 서비스 연결 상태 확인 (선택적)
      // this.healthService.checkUserService,
    ]);
  }
}
