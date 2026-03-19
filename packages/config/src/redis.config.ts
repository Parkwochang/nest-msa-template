import z from 'zod';
import { registerAs } from '@nestjs/config';
import { CommonSchema } from '@repo/common';

// ----------------------------------------------------------------------------
// prettier-ignore
export const RedisConfigSchema = z.object({
  REDIS_HOST           : CommonSchema.string,
  REDIS_PORT           : CommonSchema.port,
  REDIS_PASSWORD       : CommonSchema.string.optional(),
  REDIS_DB             : CommonSchema.port.optional(), // 파티셔닝 필요할 때
  REDIS_CONNECT_TIMEOUT: CommonSchema.timeout,
  REDIS_TTL            : CommonSchema.timeout,
  REDIS_KEY_PREFIX     : CommonSchema.string.default(''),
});

// prettier-ignore
export const REDIS_CONFIG = registerAs('redis', () => {
  return RedisConfigSchema.parse({
    REDIS_HOST           : process.env.REDIS_HOST,
    REDIS_PORT           : process.env.REDIS_PORT,
    REDIS_PASSWORD       : process.env.REDIS_PASSWORD,
    REDIS_DB             : process.env.REDIS_DB,
    REDIS_CONNECT_TIMEOUT: process.env.REDIS_CONNECT_TIMEOUT,
    REDIS_TTL            : process.env.REDIS_TTL,
    REDIS_KEY_PREFIX     : process.env.REDIS_KEY_PREFIX,
  });
});

export type RedisConfigType = z.output<typeof RedisConfigSchema>;
