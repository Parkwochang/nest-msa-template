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
