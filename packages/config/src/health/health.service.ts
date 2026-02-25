import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiskHealthIndicator, GRPCHealthIndicator, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';

import { GATEWAY_CONFIG, type GatewayConfigType } from '../env';
import { GRPC_SERVICE } from '../grpc';

@Injectable()
export class HealthService {
  constructor(
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly grpc: GRPCHealthIndicator,
    private readonly configService?: ConfigService,
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
  checkGrpcService(serviceName: string, url: string, timeout: number = 3000) {
    return this.grpc.checkService(serviceName, url, { timeout });
  }

  /**
   * User Service gRPC 연결 상태 확인 (API Gateway용)
   * @description GATEWAY_CONFIG에서 USER_GRPC_URL을 가져와서 체크합니다.
   * @param timeout 타임아웃 (밀리초, 기본값: 2000ms)
   */
  checkUserServiceConnection(timeout: number = 2000) {
    if (!this.configService) {
      // ConfigService가 없으면 체크 스킵 (일반 서비스에서는 사용 안 함)
      return Promise.resolve({
        user_service_connection: {
          status: 'up',
          message: 'ConfigService not available, skipping check',
        },
      });
    }

    const gatewayConfig = this.configService.get<GatewayConfigType>(GATEWAY_CONFIG.KEY);
    if (!gatewayConfig) {
      // GATEWAY_CONFIG가 없으면 체크 스킵
      return Promise.resolve({
        user_service_connection: {
          status: 'up',
          message: 'GATEWAY_CONFIG not available, skipping check',
        },
      });
    }

    const url = gatewayConfig.USER_GRPC_URL;
    if (!url) {
      return Promise.resolve({
        user_service_connection: {
          status: 'down',
          message: 'USER_GRPC_URL not configured',
        },
      });
    }

    // gRPC Health Checking Protocol 사용 (grpc.health.v1.Health)
    return this.grpc.checkService('grpc.health.v1.Health', url, { timeout });
  }
}
