/**
 * Zod를 사용한 Database 설정 (예시)
 *
 * 이 파일은 registerAs + Zod 방식의 예시입니다.
 * 실제 사용 시 database.config.ts를 이 방식으로 교체할 수 있습니다.
 */

import { z } from 'zod';
import { registerAs } from '@nestjs/config';

const DatabaseConfigSchema = z.object({
  url: z.string().url('DATABASE_URL must be a valid URL'),
  host: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional(),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

export default registerAs('database', (): DatabaseConfig => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  // URL 파싱
  const urlPattern = /^postgresql:\/\/(?:([^:]+):([^@]+)@)?([^:]+)(?::(\d+))?\/(.+)$/;
  const match = url.match(urlPattern);

  // Zod로 검증 및 타입 변환
  return DatabaseConfigSchema.parse({
    url,
    host: match ? match[3] : undefined,
    port: match ? parseInt(match[4] || '5432', 10) : undefined,
    username: match ? match[1] : undefined,
    password: match ? match[2] : undefined,
    database: match ? match[5] : undefined,
  });
});
