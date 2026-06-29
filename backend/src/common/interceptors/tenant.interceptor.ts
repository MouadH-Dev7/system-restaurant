import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { AuthenticatedUser } from '../../modules/auth/auth.types';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      restaurantId?: string;
      body?: Record<string, unknown>;
      query?: Record<string, unknown>;
      params?: Record<string, unknown>;
    }>();

    const user = request.user;
    if (!user?.restaurantId) {
      return next.handle();
    }

    request.restaurantId = user.restaurantId;

    const clientRestaurantId =
      (request.body?.restaurantId as string | undefined) ??
      (request.query?.restaurantId as string | undefined) ??
      (request.params?.restaurantId as string | undefined);

    if (clientRestaurantId && clientRestaurantId !== user.restaurantId) {
      throw new ForbiddenException('Cross-tenant access is not allowed');
    }

    return next.handle();
  }
}
