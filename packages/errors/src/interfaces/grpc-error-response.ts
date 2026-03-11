import type { ErrorCode, GrpcStatusCode } from '@repo/core';

export interface GrpcErrorResponse {
  code: GrpcStatusCode;
  message: string;
  details?: unknown;
  metadata?: unknown;
  errorCode: ErrorCode;
}
