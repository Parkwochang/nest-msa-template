import { registerAs } from '@nestjs/config';

export interface GrpcServiceConfig {
  url: string;
  timeout?: number;
}

export interface GrpcConfig {
  userService?: GrpcServiceConfig;
  orderService?: GrpcServiceConfig;
  productService?: GrpcServiceConfig;
  authService?: GrpcServiceConfig;
}

export default registerAs('grpc', (): GrpcConfig => {
  return {
    userService: process.env.USER_SERVICE_GRPC_URL
      ? {
          url: process.env.USER_SERVICE_GRPC_URL,
          timeout: process.env.USER_SERVICE_GRPC_TIMEOUT ? parseInt(process.env.USER_SERVICE_GRPC_TIMEOUT, 10) : 5000,
        }
      : undefined,
    orderService: process.env.ORDER_SERVICE_GRPC_URL
      ? {
          url: process.env.ORDER_SERVICE_GRPC_URL,
          timeout: process.env.ORDER_SERVICE_GRPC_TIMEOUT ? parseInt(process.env.ORDER_SERVICE_GRPC_TIMEOUT, 10) : 5000,
        }
      : undefined,
    productService: process.env.PRODUCT_SERVICE_GRPC_URL
      ? {
          url: process.env.PRODUCT_SERVICE_GRPC_URL,
          timeout: process.env.PRODUCT_SERVICE_GRPC_TIMEOUT
            ? parseInt(process.env.PRODUCT_SERVICE_GRPC_TIMEOUT, 10)
            : 5000,
        }
      : undefined,
    authService: process.env.AUTH_SERVICE_GRPC_URL
      ? {
          url: process.env.AUTH_SERVICE_GRPC_URL,
          timeout: process.env.AUTH_SERVICE_GRPC_TIMEOUT ? parseInt(process.env.AUTH_SERVICE_GRPC_TIMEOUT, 10) : 5000,
        }
      : undefined,
  };
});
