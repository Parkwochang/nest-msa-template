import { Transport } from '@nestjs/microservices';
import type { ClientOptions, GrpcOptions } from '@nestjs/microservices';

import { GATEWAY_CONFIG, type GatewayConfigType } from '../env';
import { DEFAULT_CHANNEL_OPTIONS, DEFAULT_LOADER_OPTIONS } from './grpc.constants';

// ----------------------------------------------------------------------------

export interface GrpcClientOptions extends GrpcClientConfig {
  name: string;
}

// ----------------------------------------------------------------------------
// ! 각 서비스 grpc 연결

export const createGrpcOptions = (config: Omit<GrpcClientOptions, 'name'>): ClientOptions => {
  return {
    transport: Transport.GRPC,
    options: {
      ...config,
      loader: DEFAULT_LOADER_OPTIONS,
      channelOptions: DEFAULT_CHANNEL_OPTIONS,
    },
  };
};

// ----------------------------------------------------------------------------
// ! 서비스 서버 grpc 등록용

export function connectGrpcServer(config: GrpcClientConfig): GrpcOptions {
  return {
    transport: Transport.GRPC,
    options: {
      ...config,
      loader: DEFAULT_LOADER_OPTIONS,
      channelOptions: DEFAULT_CHANNEL_OPTIONS,
    },
  };
}

// ----------------------------------------------------------------------------
// ! 서비스 grpc 클라이언트 등록용 -> useFactory config 사용 간소화

export const createGrpcClientConfig = (
  name: string,
  getConfig: (config: GatewayConfigType) => Promise<GrpcClientConfig> | GrpcClientConfig,
  inject?: any[],
) => ({
  name,
  useFactory: async (gatewayConfig: GatewayConfigType) => await getConfig(gatewayConfig),
  inject: inject || [GATEWAY_CONFIG.KEY],
});
