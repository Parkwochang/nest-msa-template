import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TypeOrmHealthIndicator, PrismaHealthIndicator } from '@nestjs/terminus';

enum ServingStatus {
  UNKNOWN = 0,
  SERVING = 1,
  NOT_SERVING = 2,
  SERVICE_UNKNOWN = 3,
}

@Controller()
export class GrpcHealthController {
  constructor(
    private readonly prismaHealth: PrismaHealthIndicator,
    @Inject('PRISMA_CLIENT') private prisma: any,
  ) {}

  @GrpcMethod('Health', 'Check')
  async check(data: { service: string }) {
    const serviceName = data.service;

    // 1. Liveness: 프로세스 생존 여부만 확인
    if (serviceName === 'liveness' || serviceName === '') {
      return { status: ServingStatus.SERVING };
    }

    // 2. Readiness: DB 등 외부 의존성 상태 확인
    if (serviceName === 'readiness') {
      const isDbConnected = await this.checkDatabase(); // 실제 DB 체크 로직
      return {
        status: isDbConnected ? ServingStatus.SERVING : ServingStatus.NOT_SERVING,
      };
    }

    console.warn(`Unknown health check service requested: ${serviceName}`);
    return { status: ServingStatus.SERVICE_UNKNOWN };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      // 1. 실제 DB 연결 상태 확인 (SELECT 1 등의 쿼리 실행)
      await this.prismaHealth.pingCheck('database', this.prisma, {
        timeout: 3000,
      });
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('DB Health Check Failed:', error.message);
        return false;
      }
      return false;
    }
  }
}
