import type { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';

export interface AuthConfigOptions {
  secret: string;
  options: JwtSignOptions;
}

export function createAuthConfig(options: AuthConfigOptions): JwtModuleOptions {
  return {
    secret: options.secret,
    signOptions: { ...options.options },
  };
}
