import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request';

// Id del usuario autenticado, que el SecurityGuard obtiene del ms de seguridad (rutas "me")
export const CurrentUserId = createParamDecorator((_data: unknown, context: ExecutionContext): number => {
  const userId = context.switchToHttp().getRequest<AuthenticatedRequest>().userId;
  if (!userId) {
    throw new UnauthorizedException('No se pudo identificar al usuario de la sesión');
  }
  return userId;
});
