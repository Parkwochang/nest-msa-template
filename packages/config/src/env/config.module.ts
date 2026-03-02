import { type DynamicModule, Global, Module } from '@nestjs/common';
import { type ConfigFactory, ConfigModule as NestConfigModule } from '@nestjs/config';

import { COMMON_CONFIG, APP_CONFIG, GATEWAY_CONFIG, AppConfigSchema, GatewayConfigSchema } from './index';

// ----------------------------------------------------------------------------

export interface ConfigModuleOptions {
  /**
   * .env 파일 경로 (로컬 환경에서 사용)
   * 기본값: 프로젝트 루트의 .env
   * - 로컬: .env 파일 사용
   * - 프로덕션: Kubernetes가 주입한 환경 변수 사용 (Vault Agent Injector)
   */
  envFilePath?: string | string[];
  /**
   * 환경 변수 이름 (기본값: NODE_ENV)
   */
  envKey?: string;
  /**
   * 로드할 설정 팩토리 목록 (기본값: 모든 설정)
   */
  load?: Array<ConfigFactory>;
  /**
   * 애플리케이션 타입 (기본값: 'api')
   */
  appType?: 'api' | 'grpc' | 'worker';
}

/**
 * 환경별 설정 관리 ConfigModule
 *
 * - 로컬 환경: .env 파일 사용
 * - 프로덕션 환경: Kubernetes가 주입한 환경 변수 사용 (Vault Agent Injector 등)
 * - registerAs를 사용한 타입 안전한 설정 제공
 *
 * @example
 * // 기본 사용 (모든 설정 로드)
 * ConfigModule.forRoot()
 *
 * @example
 * // 커스텀 .env 파일 경로
 * ConfigModule.forRoot({
 *   envFilePath: ['.env.local', '.env.development'],
 * })
 *
 * @example
 * // 특정 설정만 로드
 * ConfigModule.forRoot({
 *   load: [appConfig, databaseConfig],
 * })
 */

@Global()
@Module({})
export class AppConfigModule {
  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    const { envFilePath = ['.env', '.env.local'], envKey = 'NODE_ENV', appType = 'api', load } = options;

    return {
      module: AppConfigModule,
      imports: [
        NestConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          expandVariables: true,
          envFilePath,
          load: load || getDefaultLoad(appType),
        }),
      ],
      exports: [NestConfigModule],
    };
  }
}

function getDefaultLoad(appType: ConfigModuleOptions['appType']): Array<ConfigFactory> {
  const defaultLoad: Array<ConfigFactory> = [COMMON_CONFIG];
  if (appType === 'api') {
    defaultLoad.push(GATEWAY_CONFIG);
  } else {
    defaultLoad.push(APP_CONFIG);
  }
  return defaultLoad;
}
