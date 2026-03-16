import z from 'zod';
import { registerAs } from '@nestjs/config';

// ----------------------------------------------------------------------------
// prettier-ignore
const JwtConfigSchema = z.object({
  JWT_SECRET            : z.string().default('secret'),
  JWT_EXPIRES_IN        : z.string().or(z.number()).default('1h'),
  JWT_ISSUER            : z.string().default('woostack-auth'),
  JWT_AUDIENCE          : z.string().array().default(['api']),
  JWT_REFRESH_EXPIRES_IN: z.string().or(z.number()).default('7d'),
});

// prettier-ignore
export const JWT_CONFIG = registerAs('jwt', () => {
  return JwtConfigSchema.parse({
    JWT_SECRET            : process.env.JWT_SECRET,
    JWT_EXPIRES_IN        : process.env.JWT_EXPIRES_IN,
    JWT_ISSUER            : process.env.JWT_ISSUER,
    JWT_AUDIENCE          : process.env.JWT_AUDIENCE,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  });
});

export type JwtConfigType = z.output<typeof JwtConfigSchema>;
