import z from 'zod';
import { createZodDto } from 'nestjs-zod/dto';

const emptyToUndefined = (v: unknown) => (v ? undefined : v);

const FindOneSchema = z
  .object({
    id: z.preprocess(
      emptyToUndefined,
      z.string().uuid('ID 형식이 올바르지 않습니다.').optional(),
    ),
    email: z.preprocess(
      emptyToUndefined,
      z.string().email('이메일 형식이 올바르지 않습니다.').optional(),
    ),
  })
  .refine((v) => Number(Boolean(v.id)) + Number(Boolean(v.email)) === 1, {
    message: 'id or email 중 정확히 하나만 보내야 합니다.',
    path: ['id'],
  });

const UserStatusSchema = z.enum([
  'ACTIVE',
  'DORMANT',
  'SUSPENDED',
  'WITHDRAWN',
]);
const UserRoleSchema = z.enum(['CUSTOMER', 'ADMIN', 'OPERATOR']);
const UserSortBySchema = z.enum([
  'createdAt',
  'updatedAt',
  'lastLoginAt',
  'name',
  'email',
]);
const SortOrderSchema = z.enum(['asc', 'desc']);

// query string 입력을 고려해 coerce 사용
const FindManySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().min(1).max(100).optional(),
  status: UserStatusSchema.optional(),
  role: UserRoleSchema.optional(),
  sortBy: UserSortBySchema.default('createdAt'),
  sortOrder: SortOrderSchema.default('desc'),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  lastLoginFrom: z.coerce.date().optional(),
  lastLoginTo: z.coerce.date().optional(),
  includeWithdrawn: z.coerce.boolean().default(false),
});

export class FindOneUserQueryDto extends createZodDto(FindOneSchema) {}

export class FindManyUserQueryDto extends createZodDto(FindManySchema) {}
