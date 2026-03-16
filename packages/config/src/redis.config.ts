import z from 'zod';
import { registerAs } from '@nestjs/config';

// ----------------------------------------------------------------------------
// prettier-ignore
export const RedisConfigSchema = z.object({
  REDIS_HOST           : z.string(),
  REDIS_PORT           : z.string().or(z.number()).transform(Number),
  REDIS_PASSWORD       : z.string().optional(),
  REDIS_DB             : z.string().or(z.number()).transform(Number).optional(), // 파티셔닝 필요할 때
  REDIS_CONNECT_TIMEOUT: z.string().or(z.number()).transform(Number).default(3000),
  REDIS_TTL            : z.string().or(z.number()).transform(Number).default(60),
  REDIS_KEY_PREFIX     : z.string().default(''),
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
