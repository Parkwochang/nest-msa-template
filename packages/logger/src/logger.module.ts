import { Global, Module, type DynamicModule } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';

import { AppLogger } from './app-logger.service';
import { createWinstonConfig, type WinstonConfigOptions } from './winston.config';

// ----------------------------------------------------------------------------

/**
 * Winston 로거 모듈 등록
 *
 *
 * @param options.serviceName - 서비스 이름
 * @param options.level - 로그 레벨
 * @param options.fileLog.enabled - 파일 로그 활성화 여부
 * @param options.fileLog.dir - 로그 디렉토리
 * @param options.fileLog.maxSize - 파일 최대 크기
 * @param options.fileLog.maxFiles - 파일 보관 기간
 * @example
 * LoggerModule.forRoot({
 *   serviceName: 'API_GATEWAY',
 *   fileLog: { enabled: process.env.NODE_ENV !== 'production' },
 * })
 *
 * @example
 * // ConfigService를 사용하는 방식 (권장)
 * LoggerModule.forRootAsync({
 *   serviceName: 'API_GATEWAY',
 *   fileLog: { enabled: true },
 * })
 */

@Global()
@Module({})
export class LoggerModule {
  static forRoot(options: WinstonConfigOptions): DynamicModule {
    return {
      module: LoggerModule,
      imports: [WinstonModule.forRoot(createWinstonConfig(options))],
      providers: [AppLogger],
      exports: [WinstonModule, AppLogger],
    };
  }

  static forRootAsync(options: Omit<WinstonConfigOptions, 'nodeEnv'>): DynamicModule {
    return {
      module: LoggerModule,
      imports: [
        WinstonModule.forRootAsync({
          inject: ['ConfigService'],
          useFactory: (configService: { get: (key: string) => string | undefined }) => {
            const nodeEnv = configService.get('NODE_ENV');
            const logLevel = configService.get('LOG_LEVEL') || 'info';

            return createWinstonConfig({
              ...options,
              level: options.level || logLevel,
              nodeEnv,
            });
          },
        }),
      ],
      providers: [AppLogger],
      exports: [WinstonModule, AppLogger],
    };
  }
}
