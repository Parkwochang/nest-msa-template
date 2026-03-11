import { mapUnknownToGrpcError } from '@/mappers';
import { extractStack } from '@/mappers/utils.mapper';
import { Catch, type ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { type ErrorCode, type GrpcStatusCode } from '@repo/core';
import { AppLogger } from '@repo/logger';

// ----------------------------------------------------------------------------

@Catch()
export class GlobalGrpcExceptionFilter implements ExceptionFilter<unknown> {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(GlobalGrpcExceptionFilter.name);
  }

  catch(exception: unknown): never {
    const mapped = mapUnknownToGrpcError(exception);

    this.logger.error(mapped.message, {
      grpcCode: mapped.code,
      errorCode: mapped.errorCode,
      details: mapped.details,
      stack: extractStack(exception),
    });

    throw new RpcException(mapped);
  }
}
