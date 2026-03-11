import { RpcException } from '@nestjs/microservices';

import { type GrpcErrorResponse } from '@/interfaces';
import { ErrorCode, GRPC_STATUS, type GrpcStatusCode } from '@repo/core';

export interface AppRpcExceptionOptions {
  code?: GrpcStatusCode;
  message?: string;
  metadata?: any;
  errorCode?: ErrorCode;
}

export class AppRpcException extends RpcException {
  readonly code: GrpcStatusCode;
  readonly metadata?: any;

  constructor(options: AppRpcExceptionOptions) {
    const payload: GrpcErrorResponse = {
      code: options.code ?? GRPC_STATUS.INTERNAL,
      message: options.message ?? 'Internal server error',
      errorCode: options.errorCode,
    };
    super(payload);

    this.code = payload.code;
    this.metadata = payload.metadata;
  }
}
