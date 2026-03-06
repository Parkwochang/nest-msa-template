import type { GrpcStatusCode } from '@repo/core';

export interface GrpcErrorResponse {
  code: GrpcStatusCode;
  message: string;
  metadata: any;
}
