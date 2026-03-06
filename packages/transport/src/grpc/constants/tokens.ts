export const GRPC_PACKAGE = {
  USER: 'user',
  ORDER: 'order',
  HEALTH: 'grpc.health.v2',
  AUTH: 'auth',
  PAYMENT: 'payment',
  NOTIFICATION: 'notification',
  CATALOG: 'catalog',
} as const;

export const GRPC_SERVICE = {
  USER: 'UserService',
  ORDER: 'OrderService',
} as const;

export const GRPC_TOKENS = {
  CALLER_OPTIONS: Symbol('GRPC_CALLER_OPTIONS'),
  USER_CLIENT: Symbol('GRPC_USER_CLIENT'),
  ORDER_CLIENT: Symbol('GRPC_ORDER_CLIENT'),
  HEALTH_CLIENT: Symbol('GRPC_HEALTH_CLIENT'),
  AUTH_CLIENT: Symbol('GRPC_AUTH_CLIENT'),
  PAYMENT_CLIENT: Symbol('GRPC_PAYMENT_CLIENT'),
  NOTIFICATION_CLIENT: Symbol('GRPC_NOTIFICATION_CLIENT'),
  CATALOG_CLIENT: Symbol('GRPC_CATALOG_CLIENT'),
} as const;
