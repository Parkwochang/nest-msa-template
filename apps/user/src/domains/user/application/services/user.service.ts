import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { AppLogger } from '@repo/logger';
import { AppRpcException } from '@repo/errors';
import { GRPC_STATUS } from '@repo/core';

import {
  CreateUserCommand,
  USER_REPOSITORY,
  UserListResponseDto,
  UserRepositoryPort,
  UserResponseDto,
} from '@/domains/user/application';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserService.name);
  }

  async findById(id: string): Promise<UserResponseDto> {
    this.logger.info(`Finding user: ${id}`, { userId: id });
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new AppRpcException({
        code: GRPC_STATUS.NOT_FOUND,
        message: `User with id ${id} not found`,
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    this.logger.info(`Finding user: ${email}`, { email });
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppRpcException({
        code: GRPC_STATUS.NOT_FOUND,
        message: `User with email ${email} not found`,
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async findAll(): Promise<UserListResponseDto> {
    this.logger.info('Finding all users');
    const users = await this.userRepository.findAll();

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  }

  async create(command: CreateUserCommand): Promise<UserResponseDto> {
    this.logger.info(`Creating user: ${command.email}`, {
      email: command.email,
    });

    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new ConflictException(`User already exists: ${command.email}`);
    }

    const created = await this.userRepository.create({
      email: command.email,
      name: command.name,
    });

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      createdAt: created.createdAt.toISOString(),
    };
  }
}
