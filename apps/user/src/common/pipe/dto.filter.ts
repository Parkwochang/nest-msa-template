import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { ZodValidationPipe, ZodValidationException } from 'nestjs-zod';

import { AppRpcException } from '@repo/errors';
import { GRPC_STATUS } from '@repo/core';

// ----------------------------------------------------------------------------

@Injectable()
export class AppZodValidationPipe
  extends ZodValidationPipe
  implements PipeTransform
{
  override transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      return super.transform(value, metadata);
    } catch (error) {
      if (error instanceof ZodValidationException) {
        const zodError = error.getZodError();
        const firstMessage = zodError.issues[0]?.message ?? 'Validation failed';

        throw new AppRpcException({
          code: GRPC_STATUS.INVALID_ARGUMENT,
          message: firstMessage,
          metadata: metadata,
        });
      }
      throw error;
    }
  }
}
