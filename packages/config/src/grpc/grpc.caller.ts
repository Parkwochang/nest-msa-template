import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  RequestTimeoutException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { catchError, lastValueFrom, Observable, retry, timeout, timer } from 'rxjs';
import * as CircuitBreaker from 'opossum';

import { GRPC_STATUS } from './grpc.constants';

// ----------------------------------------------------------------------------

const DEFAULT_ATTEMPT_TIMEOUT_MS = 800;
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY_MS = 200;
const BREAKER_TIMEOUT_MS = 15000;
const BREAKER_TIMEOUT_BUFFER_MS = 250;

/**
 * gRPC 호출 래퍼 서비스
 * @description gRPC 호출을 래핑하여 예외 처리를 추가합니다. (서킷 브레이커 적용)
 * @param fn - gRPC 호출 함수
 * @param options - 옵션
 * @returns Promise<T>
 * @example
 * const caller = new GrpcCaller();
 * const result = await caller.call(() => grpcService.findAll());
 *
 * @example
 * const caller = new GrpcCaller();
 * const result = await caller.call(() => grpcService.findAll(), { timeout: 3000, retry: 2 });
 */
@Injectable()
export class GrpcCaller {
  private breaker: CircuitBreaker;

  constructor() {
    this.breaker = new CircuitBreaker(this.execute.bind(this), {
      // retry + delay를 고려해 timeout을 넉넉히 두고,
      // 실제 SLA는 call()의 totalTimeoutMs에서 제어합니다.
      timeout: BREAKER_TIMEOUT_MS,
      errorThresholdPercentage: 50,
      resetTimeout: 10000,
      // 최소 요청 수: 너무 적은 요청에서 서킷이 열리는 것을 방지
      volumeThreshold: 5,
      // 워밍업 기간: 초기 실패가 서킷을 즉시 열지 않도록
      allowWarmUp: true,
      // 통계 윈도우: 10초 동안의 통계를 추적
      rollingCountTimeout: 10000,
      // 통계 버킷: 1초 단위로 10개 버킷
      rollingCountBuckets: 10,
      // 동시 요청 수 제한: 무제한 동시 요청 방지
      capacity: 100,
    });
  }

  private async execute<T>(fn: () => Promise<T>) {
    return fn();
  }

  async call<T>(fn: () => Observable<T>, options?: GrpcCallerOptions): Promise<T> {
    const retryCount = options?.retry ?? DEFAULT_RETRY_COUNT;

    const retryDelayMs = options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

    const attemptTimeoutMs = options?.attemptTimeoutMs ?? options?.timeout ?? DEFAULT_ATTEMPT_TIMEOUT_MS;

    const totalTimeoutMs = resolveTotalTimeoutMs({
      requestedTotalTimeoutMs: options?.totalTimeoutMs,
      attemptTimeoutMs,
      retryCount,
      retryDelayMs,
    });

    return this.breaker.fire(async () =>
      lastValueFrom(
        fn().pipe(
          // 1) 시도별 timeout: 각 시도마다 최대 대기시간 제한
          timeout(attemptTimeoutMs),
          retry({
            count: retryCount,
            delay: (err, count) => {
              if (!isRetryableGrpcError(err)) {
                throw err;
              }
              return timer(retryDelayMs * count);
            },
          }),
          // 2) 전체 timeout: retry/딜레이 포함 전체 실행 시간 제한
          timeout(totalTimeoutMs),
          catchError((err) => {
            throw this.mapError(err);
          }),
        ),
      ),
    ) as Promise<T>;
  }

  private mapError(err: unknown) {
    if (isRxTimeoutError(err)) {
      return new RequestTimeoutException('gRPC call timeout');
    }

    if (isGrpcLikeError(err)) {
      const message = err.details || err.message || 'gRPC call failed';

      switch (err.code) {
        case GRPC_STATUS.INVALID_ARGUMENT:
          return new BadRequestException(message);

        case GRPC_STATUS.UNAUTHENTICATED:
          return new UnauthorizedException(message);

        case GRPC_STATUS.PERMISSION_DENIED:
          return new ForbiddenException(message);

        case GRPC_STATUS.NOT_FOUND:
          return new NotFoundException(message);

        case GRPC_STATUS.ALREADY_EXISTS:
          return new ConflictException(message);

        case GRPC_STATUS.ABORTED:
          return new ConflictException(message);

        case GRPC_STATUS.DEADLINE_EXCEEDED:
          return new RequestTimeoutException(message);

        case GRPC_STATUS.UNAVAILABLE:
          return new ServiceUnavailableException(message);

        case GRPC_STATUS.RESOURCE_EXHAUSTED:
          return new ServiceUnavailableException(message);

        default:
          return new InternalServerErrorException(message);
      }
    }

    if (err instanceof Error) {
      return new InternalServerErrorException(err.message);
    }

    return new InternalServerErrorException('gRPC call failed');
  }
}

function isGrpcLikeError(err: unknown): err is { code: number; message: string; details?: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code?: unknown }).code === 'number' &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
  );
}

function isRetryableGrpcError(err: unknown): boolean {
  if (!isGrpcLikeError(err)) return false;

  return (
    err.code === GRPC_STATUS.UNAVAILABLE ||
    err.code === GRPC_STATUS.DEADLINE_EXCEEDED ||
    err.code === GRPC_STATUS.RESOURCE_EXHAUSTED ||
    err.code === GRPC_STATUS.INTERNAL
  );
}

function isRxTimeoutError(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && 'name' in err && (err as { name?: unknown }).name === 'TimeoutError'
  );
}

function resolveTotalTimeoutMs(params: {
  requestedTotalTimeoutMs?: number;
  attemptTimeoutMs: number;
  retryCount: number;
  retryDelayMs: number;
}): number {
  const { requestedTotalTimeoutMs, attemptTimeoutMs, retryCount, retryDelayMs } = params;

  // 기본 추정치: (시도 수 * 시도 timeout) + 선형 backoff 총합 + 여유 버퍼
  const estimatedMaxMs =
    attemptTimeoutMs * (retryCount + 1) + retryDelayMs * ((retryCount * (retryCount + 1)) / 2) + 200;

  const candidate = requestedTotalTimeoutMs ?? estimatedMaxMs;

  // 구간별 timeout 보다 작으면 구간별 timeout으로 제한
  const bounded = Math.max(candidate, attemptTimeoutMs);

  // breaker timeout보다 크면 breaker가 먼저 끊기므로 안전 구간으로 제한
  return Math.min(bounded, BREAKER_TIMEOUT_MS - BREAKER_TIMEOUT_BUFFER_MS);
}
