import z from 'zod';
import { registerAs } from '@nestjs/config';

import { CommonSchema } from '@repo/common';

// ----------------------------------------------------------------------------
// prettier-ignore

export const AppConfigSchema = z.object({
  NODE_ENV    : CommonSchema.env,
  HTTP_PORT   : CommonSchema.port,
  GRPC_URL    : CommonSchema.string,
  PACKAGE_NAME: CommonSchema.string,
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
