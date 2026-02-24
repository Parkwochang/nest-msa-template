/**
 * Zod를 사용한 Redis 설정 (예시)
 */

import { z } from 'zod';
import { registerAs } from '@nestjs/config';

const RedisConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().int().min(1).max(65535).default(6379),
  password: z.string().optional(),
  db: z.coerce.number().int().min(0).optional(),
  connectTimeout: z.coerce.number().int().min(0).default(5000),
});

export type RedisConfig = z.infer<typeof RedisConfigSchema>;

export default registerAs('redis', (): RedisConfig => {
  return RedisConfigSchema.parse({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB,
    connectTimeout: process.env.REDIS_CONNECT_TIMEOUT,
  });
});
