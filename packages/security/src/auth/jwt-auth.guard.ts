import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { AppException } from '@repo/errors';

import { IS_PRIVATE_KEY, IS_PUBLIC_KEY } from './public.decorator';

// ----------------------------------------------------------------------------

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isPrivate = this.reflector.getAllAndOverride<boolean>(IS_PRIVATE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic || !isPrivate) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new AppException({ status: HttpStatus.UNAUTHORIZED, message: '토큰이 존재하지 않습니다.' });
    }

    try {
      request.user = await this.jwtService.verifyAsync(token);
    } catch {
      throw new AppException({ status: HttpStatus.UNAUTHORIZED, message: '토큰이 유효하지 않습니다.' });
    }

    return true;
  }

  private extractToken(request: { headers: Record<string, string | undefined> }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
