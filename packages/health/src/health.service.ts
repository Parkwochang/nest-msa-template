import { Injectable } from '@nestjs/common';
import {
  type CheckGRPCServiceOptions,
  type HealthIndicatorFunction,
  DiskHealthIndicator,
  GRPCHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { type GrpcOptions } from '@nestjs/microservices';

// ----------------------------------------------------------------------------

@Injectable()
export class HealthService {
  constructor(
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly grpc: GRPCHealthIndicator,
  ) {}

  /**
   * 메모리 체크: 힙 메모리가 기본 1.5GB 이하인지 확인 (파드 메모리 2GB의 75%)
   * @param memoryLimit 메모리 제한 (기본 1.5GB)
   * @returns HealthCheckResult
   */
  checkMemory(memoryLimit?: number) {
    return this.memory.checkHeap('memory_heap', memoryLimit ?? 1500 * 1024 * 1024);
  }

  /**
   * 디스크 체크: 디스크 사용량이 기본 90% 이하인지 확인
   * @param thresholdPercent 디스크 제한 (기본 90%)
   * @returns HealthCheckResult
   */
  checkStorage(thresholdPercent?: number) {
    return this.disk.checkStorage('storage', {
      path: '/',
      thresholdPercent: thresholdPercent ?? 0.9,
    });
  }

  /**
   * RSS 메모리 체크: RSS 메모리가 기본 1.8GB 이하인지 확인 (파드 메모리 2GB의 90%)
   * @param rssLimit 메모리 제한 (기본 1.8GB)
   * @returns
   */
  checkRSS(rssLimit?: number) {
    return this.memory.checkRSS('memory_rss', rssLimit ?? 1800 * 1024 * 1024);
  }

  /**
   * gRPC 서비스 헬스체크 (직접 URL 지정)
   * @param serviceName 서비스 이름 (예: 'UserService')
   * @param url gRPC 서비스 URL (예: 'localhost:5001')
   * @param timeout 타임아웃 (밀리초, 기본값: 3000ms)
   */
  checkServiceHealth(
    name: string,
    service: string = 'readiness',
    options: CheckGRPCServiceOptions<GrpcOptions>,
  ): HealthIndicatorFunction {
    return () =>
      this.grpc.checkService(name, service, {
        package: 'grpc.health.v2',
        timeout: 500,
        healthServiceName: 'Health',
        healthServiceCheck: (healthService: any, service: string) => healthService.check({ service }).toPromise(),
        ...options,
      });
  }
}
