import { GRPC_STATUS } from '@repo/core';

import { GRPC_CALLER_DEFAULTS } from '../constants';

// ----------------------------------------------------------------------------

/** gRPC 에러 타입 검사 */
export function isGrpcLikeError(err: unknown): err is { code: number; message: string; details?: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code?: unknown }).code === 'number' &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
  );
}

/** gRPC 에러 재시도 가능 여부 검사 */
export function isRetryableGrpcError(err: unknown): boolean {
  if (!isGrpcLikeError(err)) return false;

  return (
    err.code === GRPC_STATUS.UNAVAILABLE ||
    err.code === GRPC_STATUS.DEADLINE_EXCEEDED ||
    err.code === GRPC_STATUS.RESOURCE_EXHAUSTED ||
    err.code === GRPC_STATUS.INTERNAL
  );
}

/** RxJS TimeoutError 검사 */
export function isRxTimeoutError(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && 'name' in err && (err as { name?: unknown }).name === 'TimeoutError'
  );
}

/** 전체 timeout 시간 계산 */
export function resolveTotalTimeoutMs(params: {
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
  return Math.min(bounded, GRPC_CALLER_DEFAULTS.breakerTimeoutMs - GRPC_CALLER_DEFAULTS.breakerTimeoutBufferMs);
}
