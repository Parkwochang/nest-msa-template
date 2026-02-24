import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

import { requestContext, generateTraceId } from './trace.context';

/**
 * 모든 요청에 고유한 traceId를 할당하는 Interceptor
 * HTTP와 gRPC 요청을 모두 지원합니다.
 *
 * @example
 * ```typescript
 * // app.module.ts
 * providers: [
 *   {
 *     provide: APP_INTERCEPTOR,
 *     useClass: TraceInterceptor,
 *   },
 * ]
 * ```
 */
@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();

    let traceId: string;

    // HTTP 요청 (API Gateway 등)
    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest();
      traceId = request.headers['x-trace-id'] || generateTraceId();
    }
    // gRPC 요청 (마이크로서비스)
    else if (contextType === 'rpc') {
      const rpcContext = context.switchToRpc().getContext();
      const traceIdArray = rpcContext?.metadata?.get('x-trace-id');

      traceId = traceIdArray?.[0] || generateTraceId();
    }
    // 기타 (WebSocket 등)
    else {
      traceId = generateTraceId();
    }

    return new Observable((subscriber) => {
      // 동기 실행 컨텍스트에 traceId를 설정하여 전체 요청 생명주기 동안 사용
      requestContext.run({ traceId }, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
