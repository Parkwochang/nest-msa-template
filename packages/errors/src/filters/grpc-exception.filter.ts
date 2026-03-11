import { Catch, type ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { ERROR_CODE, GRPC_STATUS, type ErrorCode, type GrpcStatusCode } from '@repo/core';
import { AppLogger } from '@repo/logger';

// ----------------------------------------------------------------------------

interface GrpcErrorResponse {
  code: GrpcStatusCode;
  message: string;
  details?: unknown;
  errorCode: ErrorCode;
}

@Catch()
export class GlobalGrpcExceptionFilter implements ExceptionFilter<unknown> {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(GlobalGrpcExceptionFilter.name);
  }

  catch(exception: unknown): never {
    const mapped = mapUnknownToGrpcError(exception);

    this.logger.error(mapped.message, {
      grpcCode: mapped.code,
      errorCode: mapped.errorCode,
      details: mapped.details,
      stack: extractStack(exception),
    });

    throw new RpcException(mapped);
  }
}

function mapUnknownToGrpcError(exception: unknown): GrpcErrorResponse {
  if (exception instanceof RpcException) {
    const rpcError = exception.getError();
    return normalizeRpcErrorPayload(rpcError);
  }

  /** HTTP 에러 매핑 (BadRequestException) */
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
    const grpcCode = toGrpcStatusCode(error.code); // 정의된 에러가 아닐 시 UNKNOWN 반환

    return {
      code: grpcCode,
      errorCode: grpcStatusCodeToErrorCode(grpcCode),
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

/** http status 를 GrpcStatusCode 로 변환 */
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

/** http status 를 http error code 로 변환 */
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

/** Http error code 를 GrpcStatusCode 로 변환 */
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

function grpcStatusCodeToErrorCode(code: GrpcStatusCode): ErrorCode {
  switch (code) {
    case GRPC_STATUS.CANCELLED:
    case GRPC_STATUS.DEADLINE_EXCEEDED:
      return ERROR_CODE.TIMEOUT;
    case GRPC_STATUS.INVALID_ARGUMENT:
      return ERROR_CODE.BAD_REQUEST;
    case GRPC_STATUS.UNAUTHENTICATED:
      return ERROR_CODE.UNAUTHORIZED;
    case GRPC_STATUS.PERMISSION_DENIED:
      return ERROR_CODE.FORBIDDEN;
    case GRPC_STATUS.NOT_FOUND:
      return ERROR_CODE.NOT_FOUND;
    case GRPC_STATUS.ALREADY_EXISTS:
      return ERROR_CODE.CONFLICT;
    case GRPC_STATUS.UNAVAILABLE:
      return ERROR_CODE.SERVICE_UNAVAILABLE;
    default:
      return ERROR_CODE.INTERNAL_ERROR;
  }
}

/** error code 를 GrpcStatusCode 로 변환 */
function toGrpcStatusCode(value: unknown): GrpcStatusCode {
  if (typeof value !== 'number') return GRPC_STATUS.UNKNOWN;

  return Object.values(GRPC_STATUS).includes(value as GrpcStatusCode) ? (value as GrpcStatusCode) : GRPC_STATUS.UNKNOWN;
}

/** error code 가 ErrorCode 인지 확인 */
function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.values(ERROR_CODE).includes(value as ErrorCode);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** 에러 스택 추출 */
function extractStack(exception: unknown): string | undefined {
  if (exception instanceof Error) {
    return exception.stack;
  }

  if (isObject(exception) && 'stack' in exception && typeof exception.stack === 'string') {
    return exception.stack;
  }

  return undefined;
}
