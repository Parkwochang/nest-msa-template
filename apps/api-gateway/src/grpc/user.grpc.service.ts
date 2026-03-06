import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';

import { User } from '@repo/proto';
import { AppLogger } from '@repo/logger';
import {
  createTraceMetadata,
  GRPC_TOKENS,
  GrpcCaller,
} from '@repo/transport/grpc';

// ----------------------------------------------------------------------------

/**
 * User 마이크로서비스와 통신하는 gRPC 클라이언트 래퍼 서비스
 * @description 외부 gRPC 호출에 서킷 브레이커를 적용하여 보호합니다.
 */
@Injectable()
export class UserGrpcService implements OnModuleInit {
  private svc!: User.UserServiceClient;

  constructor(
    @Inject(GRPC_TOKENS.USER_CLIENT) private readonly client: ClientGrpc,
    private readonly grpcCaller: GrpcCaller,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserGrpcService.name);
  }

  onModuleInit() {
    this.svc = this.client.getService<User.UserServiceClient>('UserService');
  }

  /** 모든 사용자 조회 */
  async findAll(request: User.FindAllRequest): Promise<User.UserListResponse> {
    this.logger.info('findAll() called', { request });

    return this.grpcCaller.call(() =>
      this.svc.findAll(request, createTraceMetadata()),
    );
  }

  /** 사용자 ID로 조회 */
  async findOne(id: string): Promise<User.UserResponse> {
    this.logger.info('findOne() called', { id });

    return this.grpcCaller.call(() =>
      this.svc.findOne({ id }, createTraceMetadata()),
    );
  }

  /** 사용자 생성 */
  async create(data: User.CreateUserRequest): Promise<User.UserResponse> {
    return this.grpcCaller.call(() =>
      this.svc.create(data, createTraceMetadata()),
    );
  }
}
