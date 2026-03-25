import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

// ----------------------------------------------------------------------------

export interface AuthUser {
  sub: string;
  email?: string;
  roles?: string[];
  [key: string]: unknown;
}

export interface RequestContext {
  traceId: string;
  user?: AuthUser;
  [key: string]: unknown;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getTraceId = (): string | undefined => {
  return requestContext.getStore()?.traceId;
};

export const getRequestContext = (): RequestContext | undefined => {
  return requestContext.getStore();
};

export const getCurrentUser = (): AuthUser | undefined => {
  return requestContext.getStore()?.user;
};

export const generateTraceId = (): string => {
  return randomUUID();
};

export const setRequestContext = (context: Partial<RequestContext>): void => {
  const currentContext = requestContext.getStore() || { traceId: generateTraceId() };
  requestContext.enterWith({ ...currentContext, ...context });
};

export const clearRequestContext = (): void => {
  requestContext.disable();
};
