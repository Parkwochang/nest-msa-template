import { ClientGrpcProxy, ClientProxyFactory, type GrpcOptions, Transport } from '@nestjs/microservices';
import { FactoryProvider } from '@nestjs/common';

import { DEFAULT_CHANNEL_OPTIONS, DEFAULT_LOADER_OPTIONS } from '../constants';
import { GrpcClientAsyncConfig, type GrpcFactoryOptions } from '../types';

// ----------------------------------------------------------------------------

export interface RegisterGrpcClientOptions extends GrpcFactoryOptions {
  name: string;
}

export function createGrpcClientOptions(options: GrpcFactoryOptions): GrpcOptions {
  return {
    transport: Transport.GRPC,
    options: {
      url: options.url,
      package: options.package,
      protoPath: options.protoPath,
      loader: {
        ...DEFAULT_LOADER_OPTIONS,
        ...(options.loader ?? {}),
      },
      channelOptions: {
        ...DEFAULT_CHANNEL_OPTIONS,
        ...(options.channelOptions ?? {}),
      },
    },
  };
}

export function registerGrpcClient(options: RegisterGrpcClientOptions): GrpcOptions & { name: string } {
  return {
    name: options.name,
    ...createGrpcClientOptions(options),
  };
}

// ----------------------------------------------------------------------------

export function createGrpcClientProvider(config: GrpcClientAsyncConfig): FactoryProvider<ClientGrpcProxy> {
  return {
    provide: config.name,
    useFactory: async (...args: any[]) => {
      const options = await config.useFactory(...args);
      return ClientProxyFactory.create(createGrpcClientOptions(options)) as unknown as ClientGrpcProxy;
    },
    inject: config.inject || [],
  };
}
