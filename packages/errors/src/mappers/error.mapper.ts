import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_CODE, type ErrorCode } from '@repo/core';
import type { ErrorResponse } from '../interfaces';

interface MapperOptions {
  path?: string;
  traceId?: string;
}

interface HttpErrorResult {
  status: HttpStatus;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export function mapUnknownToHttpError(error: unknown): HttpErrorResult {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    const status = error.getStatus();

    if (typeof response === 'string') {
      return {
        status,
        code: statusToErrorCode(status),
        message: response,
      };
    }

    if (isObject(response)) {
      const normalized = normalizeMessageAndDetails(response, status);

      return {
        status,
        code: isErrorCode(response.code) ? response.code : statusToErrorCode(status),
        message: normalized.message,
        details: normalized.details,
      };
    }

    return {
      status,
      code: statusToErrorCode(status),
      message: 'Unexpected error',
    };
  }

  if (error instanceof Error) {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODE.INTERNAL_ERROR,
      message: error.message,
    };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: ERROR_CODE.INTERNAL_ERROR,
    message: 'Unexpected error',
    details: error,
  };
}

export function toErrorResponse(error: unknown, options?: MapperOptions): ErrorResponse {
  const mapped = mapUnknownToHttpError(error);

  return {
    success: false,
    timestamp: new Date().toISOString(),
    path: options?.path,
    traceId: options?.traceId,
    error: {
      code: mapped.code,
      message: mapped.message,
      details: mapped.details,
    },
  };
}

function statusToErrorCode(status: HttpStatus): ErrorCode {
  if (status >= 500) return ERROR_CODE.INTERNAL_ERROR;
  if (status === HttpStatus.BAD_REQUEST) return ERROR_CODE.BAD_REQUEST;
  if (status === HttpStatus.UNAUTHORIZED) return ERROR_CODE.UNAUTHORIZED;
  if (status === HttpStatus.FORBIDDEN) return ERROR_CODE.FORBIDDEN;
  if (status === HttpStatus.NOT_FOUND) return ERROR_CODE.NOT_FOUND;
  if (status === HttpStatus.CONFLICT) return ERROR_CODE.CONFLICT;
  if (status === HttpStatus.REQUEST_TIMEOUT) return ERROR_CODE.TIMEOUT;
  return ERROR_CODE.VALIDATION_ERROR;
}

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.values(ERROR_CODE).includes(value as ErrorCode);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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
