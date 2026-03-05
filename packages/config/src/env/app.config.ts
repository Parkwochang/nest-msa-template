import z from 'zod';
import { registerAs } from '@nestjs/config';

// ----------------------------------------------------------------------------
// prettier-ignore

export const AppConfigSchema = z.object({
  NODE_ENV      : z.enum(['local', 'development', 'production']),
  DATABASE_URL  : z.string(),
  GRPC_URL      : z.string(),
  HTTP_PORT     : z.string().transform(Number),
  PACKAGE_NAME  : z.string(),  
});

// prettier-ignore

export const GatewayConfigSchema = z.object({
  HTTP_PORT         : z.string().transform(Number),
  AUTH_GRPC_URL     : z.string(),
  USER_GRPC_URL     : z.string(),
  // ORDER_GRPC_URL    : z.string(),
  // PRODUCT_GRPC_URL  : z.string(),
});

// ----------------------------------------------------------------------------
// prettier-ignore

export const APP_CONFIG = registerAs('app', () => {
  return AppConfigSchema.parse({
    NODE_ENV      : process.env.NODE_ENV,
    DATABASE_URL  : process.env.DATABASE_URL,
    GRPC_URL      : process.env.GRPC_URL,
    HTTP_PORT     : process.env.HTTP_PORT,
    PACKAGE_NAME  : process.env.PACKAGE_NAME,
  });
});

// ----------------------------------------------------------------------------
// prettier-ignore

export const GATEWAY_CONFIG = registerAs('gateway', () => {
  return GatewayConfigSchema.parse({
    HTTP_PORT       : process.env.HTTP_PORT,
    AUTH_GRPC_URL   : process.env.AUTH_GRPC_URL,
    USER_GRPC_URL   : process.env.USER_GRPC_URL,
    // ORDER_GRPC_URL  : process.env.ORDER_GRPC_URL,
    // PRODUCT_GRPC_URL: process.env.PRODUCT_GRPC_URL,
  });
});

export type AppConfigType = z.output<typeof AppConfigSchema>;
export type GatewayConfigType = z.output<typeof GatewayConfigSchema>;
