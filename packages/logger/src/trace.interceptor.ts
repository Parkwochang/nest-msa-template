import { CallHandler, ExecutionContext, Inject, Injectable, type LoggerService, NestInterceptor } from '@nestjs/common';
import { finalize, Observable } from 'rxjs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { requestContext, generateTraceId } from './trace.context';
import { AppLogger } from './app-logger.service';

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
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TraceInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();
    const start = Date.now();

    let traceId: string;

    // HTTP 요청 (API Gateway 등)
    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest();

      traceId = request.headers['x-trace-id'] || generateTraceId();
    }
    // gRPC 요청 (마이크로서비스)
    else if (contextType === 'rpc') {
      const rpcContext = context.switchToRpc().getContext();
      const traceIdArray = rpcContext?.get?.('x-trace-id');

      traceId = (traceIdArray?.[0] as string) || generateTraceId();
    }
    // 기타 (WebSocket 등)
    else {
      traceId = generateTraceId();
    }

    return new Observable((subscriber) => {
      // 동기 실행 컨텍스트에 traceId를 설정하여 전체 요청 생명주기 동안 사용
      requestContext.run({ traceId }, () => {
        next
          .handle()
          .pipe(
            finalize(() => {
              const latencyMs = Date.now() - start;

              if (contextType === 'http') {
                const request = context.switchToHttp().getRequest<{
                  method?: string;
                  originalUrl?: string;
                  url?: string;
                }>();
                const response = context.switchToHttp().getResponse<{ statusCode?: number }>();

                this.logger.info('request completed', {
                  transport: 'http',
                  method: request?.method,
                  path: request?.originalUrl ?? request?.url,
                  statusCode: response?.statusCode,
                  latency: `${latencyMs}ms`,
                });
                return;
              }

              if (contextType === 'rpc') {
                const rpc = context.getHandler();
                this.logger.info('request completed', {
                  transport: 'rpc',
                  handler: rpc?.name,
                  latency: `${latencyMs}ms`,
                });
                return;
              }

              this.logger.info('request completed', {
                transport: String(contextType),
                latency: `${latencyMs}ms`,
              });
            }),
          )
          .subscribe({
            next: (value) => subscriber.next(value),
            error: (error) => subscriber.error(error),
            complete: () => subscriber.complete(),
          });
      });
    });
  }
}
