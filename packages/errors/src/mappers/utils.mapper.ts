import { HttpStatus } from '@nestjs/common';
import { ERROR_CODE, GRPC_STATUS } from '@repo/core';
import type { ErrorCode, GrpcStatusCode } from '@repo/core';

/** http status 를 error code 문자로 변환 */
export function httpStatusToErrorCode(status: HttpStatus): ErrorCode {
  if (status >= 500) return ERROR_CODE.INTERNAL_ERROR;

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

/** http status 를 grpc status code 로 변환 */
export function httpStatusToGrpcStatus(status: HttpStatus): GrpcStatusCode {
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

/** grpc status code 를 error code 문자로 변환 */
export function grpcStatusCodeToErrorCode(code: GrpcStatusCode): ErrorCode {
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
export function toGrpcStatusCode(value: unknown): GrpcStatusCode {
  if (typeof value !== 'number') return GRPC_STATUS.UNKNOWN;

  return Object.values(GRPC_STATUS).includes(value as GrpcStatusCode) ? (value as GrpcStatusCode) : GRPC_STATUS.UNKNOWN;
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.values(ERROR_CODE).includes(value as ErrorCode);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** 에러 스택 추출 */
export function extractStack(exception: unknown): string | undefined {
  if (exception instanceof Error) {
    return exception.stack;
  }

  if (isObject(exception) && 'stack' in exception && typeof exception.stack === 'string') {
    return exception.stack;
  }

  return undefined;
}

export function normalizeMessage(message: unknown): string {
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.join(', ');
  return 'Request failed';
}

/** 메시지와 상세 정보 정규화 */
export function normalizeMessageAndDetails(
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
    return {
      message: normalizeMessage(message),
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
