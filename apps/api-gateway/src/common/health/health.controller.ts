import { Controller, Get, Inject } from '@nestjs/common';

import { GATEWAY_CONFIG, GatewayConfigType } from '@repo/config/env';
import { GRPC_PACKAGE, GRPC_SERVICE } from '@repo/config/grpc';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthService,
} from '@repo/config/health';
import { PROTO_PATHS } from '@repo/proto';

// ----------------------------------------------------------------------------

/**
 * Health Check Controller
 * @description Kubernetes liveness/readiness probe용 엔드포인트 제공
 */
@Controller('health')
export class GatewayHealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly terminus: HealthCheckService,
    @Inject(GATEWAY_CONFIG.KEY) private readonly config: GatewayConfigType,
  ) {}

  /**
   * Liveness Probe
   * @description 파드가 살아있는지 확인 (Kubernetes livenessProbe)
   * @example
   * GET /health/live
   */
  @Get('live')
  @HealthCheck()
  liveness(): Promise<HealthCheckResult> {
    return this.terminus.check([]);
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
  readiness(): Promise<HealthCheckResult> {
    return this.terminus.check([
      this.healthService.checkStorage,
      this.healthService.checkMemory,

      this.healthService.checkServiceHealth(GRPC_SERVICE.USER, 'readiness', {
        url: this.config.USER_GRPC_URL,
        package: GRPC_PACKAGE.USER,
        protoPath: PROTO_PATHS.USER,
      }),
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
  check(): Promise<HealthCheckResult> {
    return this.terminus.check([
      this.healthService.checkStorage,
      this.healthService.checkMemory,
      this.healthService.checkRSS,

      this.healthService.checkServiceHealth(GRPC_SERVICE.USER, 'readiness', {
        url: this.config.USER_GRPC_URL,
        package: GRPC_PACKAGE.USER,
        protoPath: PROTO_PATHS.USER,
      }),
    ]);
  }
}
