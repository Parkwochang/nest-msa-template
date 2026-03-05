import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: 'PRISMA_CLIENT',
      useExisting: PrismaService,
    },
  ],
  exports: [PrismaService, 'PRISMA_CLIENT'],
})
export class PrismaModule {}
