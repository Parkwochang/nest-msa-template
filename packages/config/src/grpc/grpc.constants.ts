export const GRPC_PACKAGE = {
  USER: 'user',
  ORDER: 'order',
  HEALTH: 'grpc.health.v1',
};

export const GRPC_SERVICE = {
  USER: 'UserService',
  ORDER: 'OrderService',
};

export const DEFAULT_LOADER_OPTIONS = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

export const DEFAULT_CHANNEL_OPTIONS = {
  'grpc.keepalive_time_ms': 10000,
  'grpc.keepalive_timeout_ms': 5000,
  'grpc.max_concurrent_streams': 100,
  'grpc.max_receive_message_length': 1024 * 1024 * 10, // 10MB
  'grpc.max_send_message_length': 1024 * 1024 * 10, // 10MB
  'grpc.keepalive_permit_without_calls': 1,
};
