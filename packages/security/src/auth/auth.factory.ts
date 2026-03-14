import type { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';

export interface AuthConfigOptions {
  secret: string;
  expiresIn: JwtSignOptions['expiresIn'];
}

export function createAuthConfig(options: AuthConfigOptions): JwtModuleOptions {
  return {
    secret: options.secret,
    signOptions: { expiresIn: options.expiresIn },
  };
}
