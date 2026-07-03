import {
  InactiveAuthUserError,
  InvalidCredentialsError,
  PasswordLoginNotAvailableError,
} from '@/domains/auth/domain/errors';

export class AuthUserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string | null,
    public readonly provider:
      | 'LOCAL'
      | 'GOOGLE'
      | 'APPLE'
      | 'KAKAO'
      | 'NAVER' = 'LOCAL',
    public readonly role: 'CUSTOMER' | 'ADMIN' | 'OPERATOR' = 'CUSTOMER',
    public readonly status:
      | 'ACTIVE'
      | 'DORMANT'
      | 'SUSPENDED'
      | 'WITHDRAWN' = 'ACTIVE',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly lastLoginAt: Date | null = null,
  ) {}

  isOauthAccount(): boolean {
    return this.provider !== 'LOCAL';
  }

  hasPassword(): boolean {
    return (
      typeof this.passwordHash === 'string' && this.passwordHash.length > 0
    );
  }

  isPasswordMatched(password: string): boolean {
    return this.passwordHash === password;
  }

  isEmailMatched(email: string): boolean {
    return this.email === email;
  }

  isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  verifyIdentity(input: { email: string; password: string }) {
    return (
      this.isEmailMatched(input.email) && this.isPasswordMatched(input.password)
    );
  }

  canLogin(input: { email: string; password?: string }): boolean {
    if (this.isOauthAccount()) return this.isEmailMatched(input.email);

    if (!input.password) return false;

    return this.verifyIdentity({
      email: input.email,
      password: input.password,
    });
  }

  assertCanLogin(input: { email: string; password?: string }): void {
    if (this.isOauthAccount() && !this.isEmailMatched(input.email)) {
      throw new InvalidCredentialsError('이메일이 일치하지 않습니다.');
    }

    if (!this.isEmailMatched(input.email)) {
      throw new InvalidCredentialsError('이메일이 일치하지 않습니다.');
    }

    if (!this.isPasswordMatched(input.password ?? '')) {
      throw new InvalidCredentialsError('비밀번호가 일치하지 않습니다.');
    }

    if (!this.isActive()) {
      throw new InactiveAuthUserError();
    }
  }
}
