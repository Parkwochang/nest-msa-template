import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { User } from '@repo/proto';
import { AppLogger } from '@repo/logger';
import { AppRpcException, GRPC_STATUS } from '@repo/errors';

import {
  CreateUserCommand,
  FindOneUserQueryDto,
  UserResponseDto,
} from '@/domains/user/application';
import { UserService } from '@/domains/user/application/services';

// ----------------------------------------------------------------------------

@Controller()
export class UserController implements User.UserServiceController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserController.name);
  }

  @GrpcMethod('UserService', 'FindOne')
  async findOne(data: FindOneUserQueryDto): Promise<User.UserResponse> {
    this.logger.info('findOne() called', { data });

    if (data.id) {
      this.logger.info(`Finding user with id: ${data.id}`, { userId: data.id });

      return this.userService.findById(data.id);
    }

    if (data.email) {
      this.logger.info(`Finding user with email: ${data.email}`, {
        email: data.email,
      });

      return this.userService.findByEmail(data.email);
    }

    throw new AppRpcException({
      code: GRPC_STATUS.INVALID_ARGUMENT,
      message: 'One of id or email must be provided',
    });
  }

  @GrpcMethod('UserService', 'FindAll')
  async findAll(): Promise<User.UserListResponse> {
    this.logger.info('Finding all users');
    const result = await this.userService.findAll();
    return { users: result.users.map(toUserResponse) };
  }

  @GrpcMethod('UserService', 'Create')
  async create(data: User.CreateUserRequest): Promise<User.UserResponse> {
    this.logger.info(`Creating user: ${data.email}`);
    const result = await this.userService.create(toCreateUserCommand(data));
    return toUserResponse(result);
  }
}

function toCreateUserCommand(data: User.CreateUserRequest): CreateUserCommand {
  return {
    email: data.email,
    name: data.name,
  };
}

function toUserResponse(dto: UserResponseDto): User.UserResponse {
  return {
    id: dto.id,
    email: dto.email,
    name: dto.name,
    createdAt: dto.createdAt,
  };
}
