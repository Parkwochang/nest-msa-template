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
