interface GrpcClientConfig {
  url: string;
  package: string | string[]; // 서버 측에서는 여러 패키지 지원, 클라이언트는 단일 값
  protoPath: string | string[];
}

interface GrpcClientAsyncConfig {
  name: string;
  useFactory: (...args: any[]) => Promise<GrpcClientConfig> | GrpcClientConfig;
  inject?: any[];
}

interface GrpcCallerOptions {
  /**
   * @deprecated `attemptTimeoutMs`를 사용하세요.
   * 각 시도별 timeout(ms)
   */
  timeout?: number;
  /** 각 시도별 timeout(ms) */
  attemptTimeoutMs?: number;
  /** retry 포함 전체 timeout(ms) */
  totalTimeoutMs?: number;
  /** retry 횟수 (추가 시도 횟수) */
  retry?: number;
  /** retry 간 대기 시간의 기준값(ms). count에 따라 선형 증가 */
  retryDelayMs?: number;
}
