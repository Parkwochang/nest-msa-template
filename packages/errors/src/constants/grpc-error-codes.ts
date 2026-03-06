import type { GrpcStatusCode } from '@repo/core';
export { GRPC_STATUS } from '@repo/core';
export type { GrpcStatusCode } from '@repo/core';

export interface GrpcErrorResponse {
  code: GrpcStatusCode;
  message: string;
  metadata: any;
}
