import { User as PrismaUser } from '@/infra/persistence/prisma/generated/client';

import { UserEntity } from '@/domains/user/domain';

export function toUserEntity(row: PrismaUser): UserEntity {
  return new UserEntity(row.id, row.email, row.name, row.createdAt);
}
