import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';

/**
 * Health Check Controller
 * @description Kubernetes liveness/readiness probe용 엔드포인트 제공
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  /**
   * Liveness Probe
   * @description 파드가 살아있는지 확인 (Kubernetes livenessProbe)
   * @returns {Promise<HealthCheckResult>}
   * @example
   * GET /health/live
   */
  @Get('live')
  @HealthCheck()
  liveness() {
    return this.health.check([
      // 메모리 체크: 힙 메모리가 1.5GB 이하인지 확인
      () => this.memory.checkHeap('memory_heap', 1500 * 1024 * 1024),
      // RSS 메모리 체크: RSS 메모리가 3GB 이하인지 확인
      () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),
    ]);
  }

  /**
   * Readiness Probe
   * @description 파드가 트래픽을 받을 준비가 되었는지 확인 (Kubernetes readinessProbe)
   * @returns {Promise<HealthCheckResult>}
   * @example
   * GET /health/ready
   */
  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      // 디스크 체크: 디스크 사용량이 90% 이하인지 확인
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
      // 메모리 체크
      () => this.memory.checkHeap('memory_heap', 1500 * 1024 * 1024),
    ]);
  }

  /**
   * Health Check (일반)
   * @description 전체 health check
   * @returns {Promise<HealthCheckResult>}
   * @example
   * GET /health
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 1500 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }
}
