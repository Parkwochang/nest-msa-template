import { Global, Module } from '@nestjs/common';

import { PrismaService } from './database';

@Global()
@Module({
  providers: [
    {
      provide: 'PRISMA_CLIENT', // 주입 시 사용할 토큰 이름
      useExisting: PrismaService, // 실제 생성될 클래스
    },
  ],
  exports: ['PRISMA_CLIENT', PrismaService],
})
export class InfraModule {}
