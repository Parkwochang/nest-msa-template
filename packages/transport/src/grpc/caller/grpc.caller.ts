import { Injectable } from '@nestjs/common';
import CircuitBreaker from 'opossum';
import { catchError, lastValueFrom, Observable, retry, timeout, timer } from 'rxjs';

import { AppLogger, getTraceId } from '@repo/logger';

import { isGrpcLikeError, isRetryableGrpcError, resolveTotalTimeoutMs } from './grpc-error.guard';
import { GRPC_BACKPRESSURE_DEFAULT, GRPC_CALLER_DEFAULTS } from '../constants/caller';
import { mapGrpcError } from './grpc-error.mapper';
import { type GrpcCallerOptions } from '../types';

// ----------------------------------------------------------------------------

@Injectable()
export class GrpcCaller {
  private breaker: CircuitBreaker;

  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(GrpcCaller.name);
    this.breaker = new CircuitBreaker(this.execute.bind(this), GRPC_BACKPRESSURE_DEFAULT);
  }

  async call<T>(fn: () => Observable<T>, options?: GrpcCallerOptions): Promise<T> {
    const startAt = Date.now();
    const traceId = getTraceId();
    let attempts = 1;

    const retryCount = options?.retry ?? GRPC_CALLER_DEFAULTS.retryCount;

    const retryDelayMs = options?.retryDelayMs ?? GRPC_CALLER_DEFAULTS.retryDelayMs;

    const attemptTimeoutMs = options?.attemptTimeoutMs ?? options?.timeout ?? GRPC_CALLER_DEFAULTS.attemptTimeoutMs;

    const totalTimeoutMs = resolveTotalTimeoutMs({
      requestedTotalTimeoutMs: options?.totalTimeoutMs,
      attemptTimeoutMs,
      retryCount,
      retryDelayMs,
    });

    this.logger.debug('grpc call started', {
      traceId,
      retryCount,
      retryDelayMs,
      attemptTimeoutMs,
      totalTimeoutMs,
    });

    try {
      const result = (await this.breaker.fire(async () =>
        lastValueFrom(
          fn().pipe(
            // per-attempt timeout
            timeout(attemptTimeoutMs),
            // retry with backoff
            retry({
              count: retryCount,
              delay: (err, count) => {
                attempts = count + 1;

                if (!isRetryableGrpcError(err)) {
                  this.logger.debug('grpc retry skipped: non-retryable error', {
                    traceId,
                    attempt: attempts,
                    code: isGrpcLikeError(err) ? err.code : undefined,
                    message: err instanceof Error ? err.message : 'non-retryable error',
                  });
                  throw err;
                }

                const delayMs = retryDelayMs * count;
                this.logger.warn('grpc retry scheduled', {
                  traceId,
                  attempt: attempts,
                  retryDelayMs: delayMs,
                  code: isGrpcLikeError(err) ? err.code : undefined,
                  message: err instanceof Error ? err.message : undefined,
                });
                return timer(delayMs);
              },
            }),
            // total timeout : per-attempt + retry + delay
            timeout(totalTimeoutMs),
            catchError((err) => {
              throw mapGrpcError(err);
            }),
          ),
        ),
      )) as T;

      this.logger.debug('grpc call succeeded', {
        traceId,
        attempts,
        latencyMs: Date.now() - startAt,
      });

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'grpc call failed';
      this.logger.error(message, {
        traceId,
        attempts,
        latencyMs: Date.now() - startAt,
        breakerOpened: this.breaker.opened,
      });
      throw err;
    }
  }

  private async execute<T>(fn: () => Promise<T>) {
    return fn();
  }
}
