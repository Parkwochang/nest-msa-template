import { GRPC_STATUS as COMMON_GRPC_STATUS } from '@repo/core';

export const GRPC_PACKAGE = {
  USER: 'user',
  ORDER: 'order',
  HEALTH: 'grpc.health.v2',
} as const;

export const GRPC_SERVICE = {
  USER: 'UserService',
  ORDER: 'OrderService',
} as const;

export const DEFAULT_LOADER_OPTIONS = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
} as const;

export const DEFAULT_CHANNEL_OPTIONS = {
  'grpc.keepalive_time_ms': 10000,
  'grpc.keepalive_timeout_ms': 5000,
  'grpc.max_concurrent_streams': 100,
  'grpc.max_receive_message_length': 1024 * 1024 * 10, // 10MB
  'grpc.max_send_message_length': 1024 * 1024 * 10, // 10MB
  'grpc.keepalive_permit_without_calls': 1,
} as const;

export const GRPC_STATUS = {
  INVALID_ARGUMENT: COMMON_GRPC_STATUS.INVALID_ARGUMENT,
  DEADLINE_EXCEEDED: COMMON_GRPC_STATUS.DEADLINE_EXCEEDED,
  NOT_FOUND: COMMON_GRPC_STATUS.NOT_FOUND,
  ALREADY_EXISTS: COMMON_GRPC_STATUS.ALREADY_EXISTS,
  PERMISSION_DENIED: COMMON_GRPC_STATUS.PERMISSION_DENIED,
  RESOURCE_EXHAUSTED: COMMON_GRPC_STATUS.RESOURCE_EXHAUSTED,
  ABORTED: COMMON_GRPC_STATUS.ABORTED,
  INTERNAL: COMMON_GRPC_STATUS.INTERNAL,
  UNAVAILABLE: COMMON_GRPC_STATUS.UNAVAILABLE,
  UNAUTHENTICATED: COMMON_GRPC_STATUS.UNAUTHENTICATED,
} as const;
