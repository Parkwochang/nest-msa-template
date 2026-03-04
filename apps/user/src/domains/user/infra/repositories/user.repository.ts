import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/infra/persistence/prisma/prisma.service';
import { UserRepositoryPort } from '@/domains/user/application';

import { toUserEntity } from '@/domains/user/infra';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toUserEntity(row) : null;
  }

  async findByEmail(email: string) {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? toUserEntity(row) : null;
  }

  async findAll() {
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toUserEntity);
  }

  async create(input: { email: string; name: string }) {
    const row = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
      },
    });
    return toUserEntity(row);
  }
}
