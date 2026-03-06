import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { PROTO_PATHS } from '@repo/proto';
import {
  createGrpcClientOptions,
  GRPC_TOKENS,
  GRPC_PACKAGE,
} from '@repo/transport/grpc';
import { GATEWAY_CONFIG, type GatewayConfigType } from '@repo/config/env';

import { UserGrpcService } from './user.grpc.service';

// ----------------------------------------------------------------------------

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: GRPC_TOKENS.USER_CLIENT,
        inject: [GATEWAY_CONFIG.KEY],
        useFactory(gatewayConfig: GatewayConfigType) {
          return createGrpcClientOptions({
            url: gatewayConfig.USER_GRPC_URL,
            package: GRPC_PACKAGE.USER,
            protoPath: PROTO_PATHS.USER,
          });
        },
      },
    ]),
  ],
  providers: [UserGrpcService],
  exports: [UserGrpcService],
})
export class UserGrpcModule {}
