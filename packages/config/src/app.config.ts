import z from 'zod';
import { registerAs } from '@nestjs/config';

// ----------------------------------------------------------------------------
// prettier-ignore

export const AppConfigSchema = z.object({
  NODE_ENV    : z.enum(['development', 'production', 'test']).default('development'),
  HTTP_PORT   : z.string().transform(Number),
  GRPC_URL    : z.string(),
  PACKAGE_NAME: z.string(),
});

// ----------------------------------------------------------------------------
// prettier-ignore

export const APP_CONFIG = registerAs('app', () => {
  return AppConfigSchema.parse({
    NODE_ENV      : process.env.NODE_ENV,
    GRPC_URL      : process.env.GRPC_URL,
    HTTP_PORT     : process.env.HTTP_PORT,
    PACKAGE_NAME  : process.env.PACKAGE_NAME,
  });
});

export type AppConfigType = z.output<typeof AppConfigSchema>;
