import { UserEntity } from '@/domains/user/domain';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(): Promise<UserEntity[]>;
  create(input: { email: string; name: string }): Promise<UserEntity>;
}
