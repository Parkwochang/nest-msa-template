import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

// Request Context 인터페이스
export interface RequestContext {
  traceId: string;
  userId?: string;
  [key: string]: any;
}

// AsyncLocalStorage로 요청별 컨텍스트 관리
export const requestContext = new AsyncLocalStorage<RequestContext>();

export const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

/**
 * 현재 요청의 traceId를 가져옵니다
 */
export const getTraceId = (): string | undefined => {
  return requestContext.getStore()?.traceId;

  // return asyncLocalStorage.getStore()?.get('traceId');
};

/**
 * 현재 요청의 전체 컨텍스트를 가져옵니다
 */
export const getRequestContext = (): RequestContext | undefined => {
  return requestContext.getStore();
};

/**
 * 새로운 traceId를 생성합니다
 */
export const generateTraceId = (): string => {
  return randomUUID();
};

/**
 * Request Context를 설정합니다
 */
export const setRequestContext = (context: Partial<RequestContext>): void => {
  const currentContext = requestContext.getStore() || { traceId: generateTraceId() };
  requestContext.enterWith({ ...currentContext, ...context });
};
