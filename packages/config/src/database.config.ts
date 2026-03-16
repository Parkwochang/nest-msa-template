import { registerAs } from '@nestjs/config';
import z from 'zod';

// ----------------------------------------------------------------------------
// prettier-ignore
const DatabaseConfigSchema = z.object({
  DATABASE_URL              : z.string(),
  DATABASE_CONNECT_TIMEOUT  : z.number().default(2000),
  DATABASE_POOL_MIN         : z.number().default(1),
  DATABASE_POOL_MAX         : z.number().default(20),
  DATABASE_POOL_IDLE_TIMEOUT: z.number().default(30000),
});

// prettier-ignore
export const DATABASE_CONFIG = registerAs('database', () => {
  return DatabaseConfigSchema.parse({
    DATABASE_URL              : process.env.DATABASE_URL,
    DATABASE_CONNECT_TIMEOUT  : process.env.DATABASE_CONNECT_TIMEOUT,
    DATABASE_POOL_MIN         : process.env.DATABASE_POOL_MIN,
    DATABASE_POOL_MAX         : process.env.DATABASE_POOL_MAX,
    DATABASE_POOL_IDLE_TIMEOUT: process.env.DATABASE_POOL_IDLE_TIMEOUT,
  });
});

export type DatabaseConfigType = z.output<typeof DatabaseConfigSchema>;
