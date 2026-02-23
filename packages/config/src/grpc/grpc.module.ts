import { Module } from '@nestjs/common';
import type { DynamicModule, ModuleMetadata, Provider } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { createGrpcClientProvider } from './grpc-client.factory';
import { createGrpcOptions, type GrpcClientOptions } from './grpc.options';

// ----------------------------------------------------------------------------

type GrpcClientAsyncOptions = Pick<ModuleMetadata, 'imports'> & GrpcClientAsyncConfig;

@Module({})
export class GrpcModule {
  /**
   * 단일 또는 여러 gRPC 클라이언트를 등록합니다.
   *
   * @example
   * // 단일 클라이언트
   * GrpcModule.forRoot({
   *   name: 'USER_SERVICE',
   *   url: 'localhost:5001',
   *   protoPath: 'proto/user.proto',
   *   package: 'user',
   * })
   *
   * @example
   * // 여러 클라이언트
   * GrpcModule.forRoot([
   *   {
   *     name: 'USER_SERVICE',
   *     url: 'localhost:5001',
   *     protoPath: 'proto/user.proto',
   *     package: 'user',
   *   },
   *   {
   *     name: 'ORDER_SERVICE',
   *     url: 'localhost:5002',
   *     protoPath: 'proto/order.proto',
   *     package: 'order',
   *   },
   * ])
   */
  static forRoot(options: GrpcClientOptions | GrpcClientOptions[]): DynamicModule {
    const clients = Array.isArray(options) ? options : [options];

    return {
      module: GrpcModule,
      global: true,
      imports: [
        ClientsModule.register(
          clients.map(({ name, ...rest }) => ({
            name,
            ...createGrpcOptions(rest),
          })),
        ),
      ],
      exports: [ClientsModule],
    };
  }

  /**
   * 비동기적으로 gRPC 클라이언트 등록 (외부 설정 의존성 주입 시)
   * @example
   * GrpcModule.registerAsync([{
   *   name: 'ORDER_GRPC',
   *   useFactory: (config: ConfigService) => {
   *     const gatewayConfig = configService.get<GatewayConfigType>(
   *       GATEWAY_CONFIG.KEY,
   *     );
   *
   *     if (!gatewayConfig) {
   *       throw new Error('Gateway config is required');
   *     }
   *
   *     return {
   *       url: gatewayConfig.USER_GRPC_URL,
   *       package: GRPC_PACKAGE.USER,
   *       protoPath: PROTO_PATHS.USER,
   *     };
   *   },
   *   inject: [ConfigService],
   * }])
   *
   * @example
   * GrpcModule.registerAsync([
   *   createGrpcClientConfig(GRPC_SERVICE.USER, (config) => ({
   *     url: config.USER_GRPC_URL,
   *     package: GRPC_PACKAGE.USER,
   *     protoPath: PROTO_PATHS.USER,
   *   })),
   * ])
   */
  static registerAsync(options: GrpcClientAsyncOptions[]): DynamicModule {
    const providers: Provider[] = options.map(({ imports, ...option }) => createGrpcClientProvider(option));

    return {
      module: GrpcModule,
      global: true,
      imports: options.flatMap((o) => o.imports || []),
      providers,
      exports: providers,
    };
  }
}
