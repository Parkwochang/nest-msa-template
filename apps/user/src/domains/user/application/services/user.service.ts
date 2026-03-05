import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AppLogger } from '@repo/logger';

import {
  CreateUserCommand,
  FindUserQuery,
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

  async findOne(query: FindUserQuery): Promise<UserResponseDto> {
    this.logger.info(`Finding user: ${query.id}`, { userId: query.id });
    const user = await this.userRepository.findById(query.id);

    if (!user) {
      throw new NotFoundException(`User with id ${query.id} not found`);
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
    this.logger.info(`Creating user: ${command.email}`, { email: command.email });

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
