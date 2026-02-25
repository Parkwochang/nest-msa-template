/**
 * Proto 파일 경로를 제공하는 유틸리티
 *
 * @example
 * ```typescript
 * import { PROTO_PATHS } from '@repo/proto';
 *
 * const protoPath = PROTO_PATHS.USER;
 * ```
 */

import { join, dirname } from 'path';
import { existsSync } from 'fs';

/**
 * Proto 파일의 절대 경로를 반환합니다.
 *
 * require.resolve를 사용하여 패키지 경로를 안전하게 찾습니다.
 * Proto 파일은 빌드되지 않고 소스 그대로 포함되므로, 패키지 루트의 proto/ 폴더를 찾습니다.
 *
 * @param filename - Proto 파일명 (예: 'user.proto')
 * @returns Proto 파일의 절대 경로
 */
export function getProtoPath(filename: string): string {
  try {
    // 방법 1: 패키지 루트를 찾아서 proto 폴더로 이동 (가장 안전)
    // require.resolve('@repo/proto/package.json')는 패키지 루트를 찾음
    const packagePath = require.resolve('@repo/proto/package.json');
    const packageDir = dirname(packagePath);
    const protoPath = join(packageDir, 'proto', filename);

    // 파일 존재 확인 (선택적 - 경로만 반환해도 gRPC 로더가 체크함)
    if (existsSync(protoPath)) {
      return protoPath;
    }

    // 파일이 없어도 경로는 반환 (런타임에 gRPC 로더가 체크)
    return protoPath;
  } catch (error) {
    // Fallback: 현재 파일 기준 (개발 환경 또는 빌드 전)
    // dist/proto-paths.js에서 실행되면 ../proto/ 위치
    return join(__dirname, '../proto', filename);
  }
}

/**
 * 사용 가능한 모든 proto 파일 경로
 *
 * 런타임에 require.resolve를 통해 안전하게 경로를 해결합니다.
 * - node_modules에 설치된 경우: 정확한 패키지 경로 사용
 * - workspace 개발 환경: 상대 경로 사용
 */
export const PROTO_PATHS = {
  USER: getProtoPath('user.proto'),
  ORDER: getProtoPath('order.proto'),
  PRODUCT: getProtoPath('product.proto'),
  HEALTH: getProtoPath('health.proto'),
} as const;
