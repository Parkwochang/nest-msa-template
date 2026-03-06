import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_CODE, type ErrorCode } from '@repo/core';

import type { ErrorEnvelope } from '../interfaces';

export interface AppExceptionOptions {
  code?: ErrorCode;
  message: string;
  status?: HttpStatus;
  details?: unknown;
}

export class AppException extends HttpException {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(options: AppExceptionOptions) {
    const payload: ErrorEnvelope = {
      code: options.code ?? ERROR_CODE.INTERNAL_ERROR,
      message: options.message,
      details: options.details,
    };
    const status = options.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
    super(payload, status);

    this.code = payload.code;
    this.details = payload.details;
  }
}
