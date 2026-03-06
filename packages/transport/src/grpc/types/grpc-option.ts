export interface GrpcFactoryOptions {
  url: string;
  package: string | string[];
  protoPath: string | string[];
  loader?: Record<string, unknown>;
  channelOptions?: Record<string, unknown>;
}

export interface GrpcClientAsyncConfig {
  name: string;
  useFactory: (...args: any[]) => Promise<GrpcFactoryOptions> | GrpcFactoryOptions;
  inject?: any[];
}
