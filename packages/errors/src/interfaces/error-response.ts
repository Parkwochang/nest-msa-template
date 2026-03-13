import type { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@repo/core';

export interface ErrorEnvelope {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export interface ErrorResponse {
  success: false;
  timestamp: string;
  path?: string;
  traceId?: string;
  error: ErrorEnvelope;
}

export interface HttpMapperOptions {
  path?: string;
  traceId?: string;
}

export interface HttpErrorResponse {
  status: HttpStatus;
  code: ErrorCode;
  message: string;
  details?: unknown;
}
