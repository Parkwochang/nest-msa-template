import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { User } from '@repo/proto';

import {
  CreateUserCommand,
  FindUserQuery,
  UserResponseDto,
  UserService,
} from '@/domains/user/application';
import { AppLogger } from '@repo/logger';

@Controller()
export class UserController implements User.UserServiceController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserController.name);
  }

  @GrpcMethod('UserService', 'FindOne')
  async findOne(data: User.FindOneRequest): Promise<User.UserResponse> {
    this.logger.info(`Finding user with id: ${data.id}`, { userId: data.id });
    const result = await this.userService.findOne(toFindUserQuery(data));
    return toUserResponse(result);
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

function toFindUserQuery(data: User.FindOneRequest): FindUserQuery {
  return { id: data.id };
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
