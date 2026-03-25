import { Metadata } from '@grpc/grpc-js';

import { getTraceId, getCurrentUser } from '@repo/logger';

// ----------------------------------------------------------------------------

export const TRACE_ID_HEADER = 'x-trace-id';
export const USER_ID_HEADER = 'x-user-id';

// ----------------------------------------------------------------------------

export function createMetadata(init?: Record<string, string>): Metadata {
  const metadata = new Metadata();

  if (init) {
    for (const [key, value] of Object.entries(init)) {
      metadata.set(key, value);
    }
  }

  return metadata;
}

export function createTraceMetadata(traceId?: string, metadata?: Metadata): Metadata {
  const next = metadata ?? new Metadata();
  const traceIdValue = traceId ?? getTraceId();
  const user = getCurrentUser();

  if (traceIdValue) {
    next.set(TRACE_ID_HEADER, traceIdValue);
  }

  if (user?.sub) {
    next.set(USER_ID_HEADER, user.sub);
  }

  return next;
}

export function withTraceId(traceId?: string, metadata?: Metadata): Metadata {
  const next = metadata ?? new Metadata();

  if (traceId) {
    next.set(TRACE_ID_HEADER, traceId);
  }

  return next;
}

export function readTraceIdFromRpcContext(context: unknown): string | undefined {
  if (typeof context !== 'object' || context === null || !('get' in context)) {
    return undefined;
  }

  const getter = (context as { get?: (key: string) => unknown }).get;

  if (typeof getter !== 'function') {
    return undefined;
  }

  const value = getter(TRACE_ID_HEADER);

  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];

  if (typeof value === 'string') return value;

  return undefined;
}
