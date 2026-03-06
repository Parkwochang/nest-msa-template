import { ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';

import { mapUnknownToHttpError, toErrorResponse } from '../mappers';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest<{ url?: string; headers?: Record<string, unknown> }>();

    const mapped = mapUnknownToHttpError(exception);
    const body = toErrorResponse(exception, {
      path: request?.url,
      traceId: extractTraceId(request?.headers),
    });

    response.status(mapped.status ?? HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}

function extractTraceId(headers?: Record<string, unknown>): string | undefined {
  const traceHeader = headers?.['x-trace-id'];
  if (typeof traceHeader === 'string') return traceHeader;
  if (Array.isArray(traceHeader) && typeof traceHeader[0] === 'string') {
    return traceHeader[0];
  }

  return undefined;
}
