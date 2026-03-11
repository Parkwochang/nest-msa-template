import { HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { ERROR_CODE, GRPC_STATUS } from '@repo/core';

import { type GrpcErrorResponse } from '@/interfaces';
import {
  grpcStatusCodeToErrorCode,
  httpStatusToErrorCode,
  httpStatusToGrpcStatus,
  isErrorCode,
  isObject,
  normalizeMessage,
  normalizeMessageAndDetails,
  toGrpcStatusCode,
} from './utils.mapper';

// ----------------------------------------------------------------------------

export function mapUnknownToGrpcError(exception: unknown): GrpcErrorResponse {
  if (exception instanceof RpcException) {
    const rpcError = exception.getError();
    return normalizeRpcErrorPayload(rpcError);
  }

  /** HTTP 에러 매핑 하이브리드 시 사용 (HttpException) */
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        code: httpStatusToGrpcStatus(status),
        message: response,
        errorCode: httpStatusToErrorCode(status),
      };
    }

    if (isObject(response)) {
      const normalized = normalizeMessageAndDetails(response, status);

      return {
        code: httpStatusToGrpcStatus(status),
        message: normalized.message,
        details: normalized.details,
        errorCode: isErrorCode(response.code) ? response.code : httpStatusToErrorCode(status),
      };
    }
  }

  if (exception instanceof Error) {
    return {
      code: GRPC_STATUS.INTERNAL,
      message: exception.message,
      errorCode: ERROR_CODE.INTERNAL_ERROR,
    };
  }

  return {
    code: GRPC_STATUS.INTERNAL,
    message: 'Unexpected error',
    details: exception,
    errorCode: ERROR_CODE.INTERNAL_ERROR,
  };
}

// ----------------------------------------------------------------------------

function normalizeRpcErrorPayload(error: unknown): GrpcErrorResponse {
  if (typeof error === 'string') {
    return {
      code: GRPC_STATUS.UNKNOWN,
      message: error,
      errorCode: ERROR_CODE.INTERNAL_ERROR,
    };
  }

  if (isObject(error)) {
    const code = toGrpcStatusCode(error.code);

    return {
      code,
      errorCode: grpcStatusCodeToErrorCode(code),
      message: normalizeMessage(error.message),
      details: error.details,
    };
  }

  return {
    code: GRPC_STATUS.UNKNOWN,
    message: 'Unexpected error',
    errorCode: ERROR_CODE.INTERNAL_ERROR,
  };
}
