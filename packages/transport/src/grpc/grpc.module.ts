import { Global, Module } from '@nestjs/common';

import { GrpcCaller } from './caller';

@Global()
@Module({
  providers: [GrpcCaller],
  exports: [GrpcCaller],
})
export class GrpcModule {}
