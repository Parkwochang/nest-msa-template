import z from 'zod';
import { registerAs } from '@nestjs/config';

// ----------------------------------------------------------------------------
// prettier-ignore
const GatewayConfigSchema = z.object({
  HTTP_PORT    : z.number(),
  AUTH_GRPC_URL: z.string(),
  USER_GRPC_URL: z.string(),
});

export const GATEWAY_CONFIG = registerAs('gateway', () => {
  return GatewayConfigSchema.parse({
    HTTP_PORT: process.env.HTTP_PORT,
    AUTH_GRPC_URL: process.env.AUTH_GRPC_URL,
    USER_GRPC_URL: process.env.USER_GRPC_URL,
  });
});

export type GatewayConfigType = z.output<typeof GatewayConfigSchema>;
