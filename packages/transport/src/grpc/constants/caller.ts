export const GRPC_CALLER_DEFAULTS = {
  attemptTimeoutMs: 800,
  retryCount: 2,
  retryDelayMs: 200,
  breakerTimeoutMs: 15000,
  breakerTimeoutBufferMs: 250,
} as const;

export const GRPC_CALLER_ERROR_THRESHOLD_PERCENTAGE = 50;

export const GRPC_BACKPRESSURE_DEFAULT = {
  // retry + delay를 고려해 timeout을 넉넉히 두고,
  // 실제 SLA는 call()의 totalTimeoutMs에서 제어합니다.
  timeout: GRPC_CALLER_DEFAULTS.breakerTimeoutMs,
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
};
