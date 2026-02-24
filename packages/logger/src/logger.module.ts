import { Module, type DynamicModule } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';

import { createWinstonConfig, type WinstonConfigOptions } from './winston.config';

// ----------------------------------------------------------------------------

/**
 * Winston 로거 모듈 등록
 *
 *
 * @param options.serviceName - 서비스 이름
 * @param options.disableFileLog - 파일 로그 비활성화 (production 시 ELK 로그 수집을 위해 비활성화)
 * @param options.level - 로그 레벨
 * @param options.logDir - 로그 디렉토리
 * @param options.maxSize - 파일 최대 크기
 * @param options.maxFiles - 파일 보관 기간
 * @example
 * LoggerModule.forRoot({
 *   serviceName: 'API_GATEWAY',
 *   disableFileLog: process.env.NODE_ENV === 'production',
 * })
 *
 * @example
 * // ConfigService를 사용하는 방식 (권장)
 * LoggerModule.forRootAsync({
 *   serviceName: 'API_GATEWAY',
 *   disableFileLog: true,
 * })
 */

@Module({})
export class LoggerModule {
  static forRoot(options: WinstonConfigOptions): DynamicModule {
    return {
      global: true,
      module: LoggerModule,
      imports: [WinstonModule.forRoot(createWinstonConfig(options))],
      exports: [WinstonModule],
    };
  }

  static forRootAsync(options: Omit<WinstonConfigOptions, 'nodeEnv'>): DynamicModule {
    return {
      global: true,
      module: LoggerModule,
      imports: [
        WinstonModule.forRootAsync({
          inject: ['ConfigService'],
          useFactory: (configService: { get: (key: string) => string | undefined }) => {
            // ConfigService에서 환경 변수 가져오기
            const nodeEnv = configService.get('NODE_ENV') || process.env.NODE_ENV;
            const logLevel = configService.get('LOG_LEVEL') || process.env.LOG_LEVEL;

            return createWinstonConfig({
              ...options,
              level: options.level || logLevel,
              nodeEnv,
            });
          },
        }),
      ],
      exports: [WinstonModule],
    };
  }
}
