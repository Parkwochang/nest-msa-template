import { Module } from '@nestjs/common';

import { PrismaModule } from '@/infra/persistence/prisma';
import { USER_REPOSITORY, UserService } from '@/domains/user/application';
import { PrismaUserRepository } from '@/domains/user/infra';

import { UserController } from './user.grpc.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
