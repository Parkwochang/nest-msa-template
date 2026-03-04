import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AppLogger } from '@repo/logger';
import { User } from '@repo/proto';

import {
  USER_REPOSITORY,
  UserRepositoryPort,
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

  async findOne(id: string): Promise<User.UserResponse> {
    this.logger.info(`Finding user: ${id}`, { userId: id });
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async findAll(): Promise<User.UserListResponse> {
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

  async create(data: User.CreateUserRequest): Promise<User.UserResponse> {
    this.logger.info(`Creating user: ${data.email}`, { email: data.email });

    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException(`User already exists: ${data.email}`);
    }

    const created = await this.userRepository.create({
      email: data.email,
      name: data.name,
    });

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      createdAt: created.createdAt.toISOString(),
    };
  }
}
