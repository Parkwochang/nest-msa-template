import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_CODE } from '@repo/core';

import type { ErrorResponse, HttpErrorResponse, HttpMapperOptions } from '../interfaces';
import { httpStatusToErrorCode, isErrorCode, isObject, normalizeMessageAndDetails } from './utils.mapper';

// ----------------------------------------------------------------------------

/** 에러를 HttpErrorResult 로 변환 */
export function mapUnknownToHttpError(error: unknown): HttpErrorResponse {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    const status = error.getStatus();

    if (typeof response === 'string') {
      return {
        status,
        code: httpStatusToErrorCode(status),
        message: response,
      };
    }

    if (isObject(response)) {
      const normalized = normalizeMessageAndDetails(response, status);

      return {
        status,
        code: isErrorCode(response.code) ? response.code : httpStatusToErrorCode(status),
        message: normalized.message,
        details: normalized.details,
      };
    }

    return {
      status,
      code: httpStatusToErrorCode(status),
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

/** 에러를 ErrorResponse 로 변환 */
export function toErrorResponse(error: unknown, options?: HttpMapperOptions): ErrorResponse {
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
