import { JwtModule } from '@nestjs/jwt';
import { type DynamicModule, Module } from '@nestjs/common';

import { type AuthConfigOptions, createAuthConfig } from './auth.factory';

// ----------------------------------------------------------------------------

@Module({})
export class AuthModule {
  /**
   * 동기적으로 Auth 설정
   * @example
   * AuthModule.forRoot({
   *   secret: process.env.JWT_SECRET,
   *   expiresIn: '1h'
   * })
   */
  static forRoot(options: AuthConfigOptions): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      imports: [JwtModule.register(createAuthConfig(options))],
      exports: [JwtModule], // JwtService를 다른 모듈에서 사용 가능
    };
  }

  /**
   * 비동기적으로 Auth 설정 (ConfigService 등 사용 시)
   * @example
   * AuthModule.forRootAsync({
   *   inject: [ConfigService],
   *   useFactory: (config: ConfigService) => ({
   *     secret: config.get('JWT_SECRET'),
   *     expiresIn: '1h'
   *   })
   * })
   */
  static forRootAsync(options: {
    inject?: any[];
    useFactory: (...args: any[]) => AuthConfigOptions | Promise<AuthConfigOptions>;
  }): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      imports: [
        JwtModule.registerAsync({
          inject: options.inject,
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory(...args);
            return createAuthConfig(config);
          },
        }),
      ],
      exports: [JwtModule],
    };
  }
}
