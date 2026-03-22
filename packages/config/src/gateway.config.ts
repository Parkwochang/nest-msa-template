import z from 'zod';
import { registerAs } from '@nestjs/config';

import { CommonSchema } from '@repo/common';

// ----------------------------------------------------------------------------
// prettier-ignore
const GatewayConfigSchema = z.object({
  HTTP_PORT    : CommonSchema.port,
  AUTH_GRPC_URL: CommonSchema.string,
  USER_GRPC_URL: CommonSchema.string,
});

// prettier-ignore
export const GATEWAY_CONFIG = registerAs('gateway', () => {
  return GatewayConfigSchema.parse({
    HTTP_PORT    : process.env.HTTP_PORT,
    AUTH_GRPC_URL: process.env.AUTH_GRPC_URL,
    USER_GRPC_URL: process.env.USER_GRPC_URL,
  });
});

export type GatewayConfigType = z.output<typeof GatewayConfigSchema>;
