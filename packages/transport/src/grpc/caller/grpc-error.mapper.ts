import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  RequestTimeoutException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { GRPC_STATUS } from '@repo/core';

import { isGrpcLikeError, isRxTimeoutError } from './grpc-error.guard';

// ----------------------------------------------------------------------------

/**
 * gRPC 에러 매핑
 * @param err - 에러
 * @returns http 에러 반환
 * @example
 * try {
 *   await grpcCaller.call(() => grpcService.someMethod());
 * } catch (err) {
 *   throw mapGrpcError(err);
 * }
 */
export function mapGrpcError(err: unknown) {
  if (isRxTimeoutError(err)) {
    return new RequestTimeoutException('gRPC call timeout');
  }

  if (isGrpcLikeError(err)) {
    const message = err.details || err.message || 'gRPC call failed';

    switch (err.code) {
      case GRPC_STATUS.CANCELLED:
        return new RequestTimeoutException('gRPC call cancelled');

      case GRPC_STATUS.UNKNOWN:
        return new BadRequestException(message);

      case GRPC_STATUS.INVALID_ARGUMENT:
        return new BadRequestException(message);

      case GRPC_STATUS.UNAUTHENTICATED:
        return new UnauthorizedException(message);

      case GRPC_STATUS.PERMISSION_DENIED:
        return new ForbiddenException(message);

      case GRPC_STATUS.NOT_FOUND:
        return new NotFoundException(message);

      case GRPC_STATUS.ALREADY_EXISTS:
        return new ConflictException(message);

      case GRPC_STATUS.ABORTED:
        return new ConflictException(message);

      case GRPC_STATUS.DEADLINE_EXCEEDED:
        return new RequestTimeoutException(message);

      case GRPC_STATUS.UNAVAILABLE:
        return new ServiceUnavailableException(message);

      case GRPC_STATUS.RESOURCE_EXHAUSTED:
        return new ServiceUnavailableException(message);

      default:
        return new InternalServerErrorException(message);
    }
  }

  if (err instanceof Error) {
    return new InternalServerErrorException(err.message);
  }

  return new InternalServerErrorException('gRPC call failed');
}
