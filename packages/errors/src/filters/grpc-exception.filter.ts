import { Catch, type ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { ERROR_CODE, GRPC_STATUS, type ErrorCode, type GrpcStatusCode } from '@repo/core';

interface GrpcErrorResponse {
  code: GrpcStatusCode;
  message: string;
  details?: unknown;
  errorCode: ErrorCode;
}

@Catch()
export class GlobalGrpcExceptionFilter implements ExceptionFilter<unknown> {
  catch(exception: unknown): never {
    throw new RpcException(mapUnknownToGrpcError(exception));
  }
}

function mapUnknownToGrpcError(exception: unknown): GrpcErrorResponse {
  if (exception instanceof RpcException) {
    const rpcError = exception.getError();
    return normalizeRpcErrorPayload(rpcError);
  }

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

function normalizeRpcErrorPayload(error: unknown): GrpcErrorResponse {
  if (typeof error === 'string') {
    return {
      code: GRPC_STATUS.UNKNOWN,
      message: error,
      errorCode: ERROR_CODE.INTERNAL_ERROR,
    };
  }

  if (isObject(error)) {
    const grpcCode = typeof error.code === 'number' ? toGrpcStatusCode(error.code) : undefined;
    const domainCode = isErrorCode(error.code) ? error.code : undefined;

    return {
      code: grpcCode ?? (domainCode ? errorCodeToGrpcStatus(domainCode) : GRPC_STATUS.UNKNOWN),
      message: normalizeMessage(error.message),
      details: error.details,
      errorCode: domainCode ?? ERROR_CODE.INTERNAL_ERROR,
    };
  }

  return {
    code: GRPC_STATUS.UNKNOWN,
    message: 'Unexpected error',
    errorCode: ERROR_CODE.INTERNAL_ERROR,
  };
}

function normalizeMessage(message: unknown): string {
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.join(', ');
  return 'Unexpected error';
}

function normalizeMessageAndDetails(
  response: Record<string, unknown>,
  status: HttpStatus,
): { message: string; details?: unknown } {
  const message = response.message;

  if (typeof message === 'string') {
    return {
      message,
      details: response.details,
    };
  }

  if (Array.isArray(message)) {
    const isValidationError = status === HttpStatus.BAD_REQUEST;

    return {
      message: isValidationError ? 'Validation failed' : 'Request failed',
      details: {
        ...(isObject(response.details) ? response.details : {}),
        messages: message,
      },
    };
  }

  return {
    message: 'Unexpected error',
    details: response.details,
  };
}

function httpStatusToGrpcStatus(status: HttpStatus): GrpcStatusCode {
  if (status >= 500) {
    return GRPC_STATUS.INTERNAL;
  }

  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return GRPC_STATUS.INVALID_ARGUMENT;
    case HttpStatus.UNAUTHORIZED:
      return GRPC_STATUS.UNAUTHENTICATED;
    case HttpStatus.FORBIDDEN:
      return GRPC_STATUS.PERMISSION_DENIED;
    case HttpStatus.NOT_FOUND:
      return GRPC_STATUS.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return GRPC_STATUS.ALREADY_EXISTS;
    case HttpStatus.REQUEST_TIMEOUT:
      return GRPC_STATUS.DEADLINE_EXCEEDED;
    case HttpStatus.SERVICE_UNAVAILABLE:
      return GRPC_STATUS.UNAVAILABLE;
    default:
      return GRPC_STATUS.UNKNOWN;
  }
}

function httpStatusToErrorCode(status: HttpStatus): ErrorCode {
  if (status >= 500) {
    return ERROR_CODE.INTERNAL_ERROR;
  }

  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ERROR_CODE.BAD_REQUEST;
    case HttpStatus.UNAUTHORIZED:
      return ERROR_CODE.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ERROR_CODE.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ERROR_CODE.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ERROR_CODE.CONFLICT;
    case HttpStatus.REQUEST_TIMEOUT:
      return ERROR_CODE.TIMEOUT;
    case HttpStatus.SERVICE_UNAVAILABLE:
      return ERROR_CODE.SERVICE_UNAVAILABLE;
    default:
      return ERROR_CODE.VALIDATION_ERROR;
  }
}

function errorCodeToGrpcStatus(errorCode: ErrorCode): GrpcStatusCode {
  switch (errorCode) {
    case ERROR_CODE.BAD_REQUEST:
    case ERROR_CODE.VALIDATION_ERROR:
      return GRPC_STATUS.INVALID_ARGUMENT;
    case ERROR_CODE.UNAUTHORIZED:
      return GRPC_STATUS.UNAUTHENTICATED;
    case ERROR_CODE.FORBIDDEN:
      return GRPC_STATUS.PERMISSION_DENIED;
    case ERROR_CODE.NOT_FOUND:
      return GRPC_STATUS.NOT_FOUND;
    case ERROR_CODE.CONFLICT:
      return GRPC_STATUS.ALREADY_EXISTS;
    case ERROR_CODE.TIMEOUT:
      return GRPC_STATUS.DEADLINE_EXCEEDED;
    case ERROR_CODE.SERVICE_UNAVAILABLE:
      return GRPC_STATUS.UNAVAILABLE;
    default:
      return GRPC_STATUS.INTERNAL;
  }
}

function toGrpcStatusCode(value: number): GrpcStatusCode {
  return Object.values(GRPC_STATUS).includes(value as GrpcStatusCode) ? (value as GrpcStatusCode) : GRPC_STATUS.UNKNOWN;
}

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.values(ERROR_CODE).includes(value as ErrorCode);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
