import { UserGrpcService } from '@/grpc/user.grpc.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserFacade {
  constructor(private readonly userGrpc: UserGrpcService) {}

  async findAll() {
    return this.userGrpc.findAll({});
  }

  async findOne(id: string) {
    return this.userGrpc.findOne(id);
  }
}
