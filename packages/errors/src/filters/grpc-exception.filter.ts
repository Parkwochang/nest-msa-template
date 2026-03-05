import { Catch, type ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { ERROR_CODE, type ErrorCode } from '../constants';

const GRPC_STATUS = {
  OK: 0,
  CANCELLED: 1,
  UNKNOWN: 2,
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  ABORTED: 10,
  OUT_OF_RANGE: 11,
  UNIMPLEMENTED: 12,
  INTERNAL: 13,
  UNAVAILABLE: 14,
  DATA_LOSS: 15,
  UNAUTHENTICATED: 16,
} as const;

type GrpcStatusCode = (typeof GRPC_STATUS)[keyof typeof GRPC_STATUS];

interface GrpcErrorResponse {
  code: GrpcStatusCode;
  message: string;
  details?: unknown;
  errorCode: ErrorCode;
}

@Catch()
export class GlobalGrpcExceptionFilter implements ExceptionFilter<unknown> {
  catch(exception: unknown): never {
    const mapped = mapUnknownToGrpcError(exception);

    console.log('exception', mapped.code, mapped.message, mapped.details, mapped.errorCode, mapped);
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
  if (status >= 500) return GRPC_STATUS.INTERNAL;
  if (status === HttpStatus.BAD_REQUEST) return GRPC_STATUS.INVALID_ARGUMENT;
  if (status === HttpStatus.UNAUTHORIZED) return GRPC_STATUS.UNAUTHENTICATED;
  if (status === HttpStatus.FORBIDDEN) return GRPC_STATUS.PERMISSION_DENIED;
  if (status === HttpStatus.NOT_FOUND) return GRPC_STATUS.NOT_FOUND;
  if (status === HttpStatus.CONFLICT) return GRPC_STATUS.ALREADY_EXISTS;
  if (status === HttpStatus.REQUEST_TIMEOUT) return GRPC_STATUS.DEADLINE_EXCEEDED;
  if (status === HttpStatus.SERVICE_UNAVAILABLE) return GRPC_STATUS.UNAVAILABLE;
  return GRPC_STATUS.UNKNOWN;
}

function httpStatusToErrorCode(status: HttpStatus): ErrorCode {
  if (status >= 500) return ERROR_CODE.INTERNAL_ERROR;
  if (status === HttpStatus.BAD_REQUEST) return ERROR_CODE.BAD_REQUEST;
  if (status === HttpStatus.UNAUTHORIZED) return ERROR_CODE.UNAUTHORIZED;
  if (status === HttpStatus.FORBIDDEN) return ERROR_CODE.FORBIDDEN;
  if (status === HttpStatus.NOT_FOUND) return ERROR_CODE.NOT_FOUND;
  if (status === HttpStatus.CONFLICT) return ERROR_CODE.CONFLICT;
  if (status === HttpStatus.REQUEST_TIMEOUT) return ERROR_CODE.TIMEOUT;
  if (status === HttpStatus.SERVICE_UNAVAILABLE) return ERROR_CODE.SERVICE_UNAVAILABLE;
  return ERROR_CODE.VALIDATION_ERROR;
}

function errorCodeToGrpcStatus(errorCode: ErrorCode): GrpcStatusCode {
  if (errorCode === ERROR_CODE.BAD_REQUEST || errorCode === ERROR_CODE.VALIDATION_ERROR) {
    return GRPC_STATUS.INVALID_ARGUMENT;
  }
  if (errorCode === ERROR_CODE.UNAUTHORIZED) return GRPC_STATUS.UNAUTHENTICATED;
  if (errorCode === ERROR_CODE.FORBIDDEN) return GRPC_STATUS.PERMISSION_DENIED;
  if (errorCode === ERROR_CODE.NOT_FOUND) return GRPC_STATUS.NOT_FOUND;
  if (errorCode === ERROR_CODE.CONFLICT) return GRPC_STATUS.ALREADY_EXISTS;
  if (errorCode === ERROR_CODE.TIMEOUT) return GRPC_STATUS.DEADLINE_EXCEEDED;
  if (errorCode === ERROR_CODE.SERVICE_UNAVAILABLE) return GRPC_STATUS.UNAVAILABLE;
  return GRPC_STATUS.INTERNAL;
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
