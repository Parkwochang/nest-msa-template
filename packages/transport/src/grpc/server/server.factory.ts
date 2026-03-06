import { Transport, type GrpcOptions } from '@nestjs/microservices';

import { DEFAULT_CHANNEL_OPTIONS, DEFAULT_LOADER_OPTIONS } from '../constants';
import { type GrpcFactoryOptions } from '../types';

// ----------------------------------------------------------------------------

export function createGrpcServerOptions(options: GrpcFactoryOptions): GrpcOptions {
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
