import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import axios from 'axios';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request';

const PERMISSIONS_VALIDATION_PATH = '/api/internal/security/permissions-validation';
const INTERNAL_KEY_HEADER = 'X-Internal-Key';
const REQUEST_TIMEOUT_MS = 5000;

type PermissionValidationResponse = { allowed: boolean; userId: number | null };

// Autoriza cada petición preguntando al ms de seguridad si el usuario del JWT tiene permiso (método + ruta)
@Injectable()
export class SecurityGuard implements CanActivate {
  private readonly logger = new Logger(SecurityGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Este guard es solo HTTP: los eventos del gateway (WebSocket) no pasan por él
    if (context.getType() !== 'http' || this.isPublic(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    const { allowed, userId } = await this.validatePermission(token, request.path, request.method);

    if (!allowed) {
      throw new ForbiddenException('No tienes permiso para realizar esta acción');
    }
    // Queda disponible para @CurrentUserId() en las rutas que trabajan sobre el propio usuario
    request.userId = userId ?? undefined;
    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  private extractBearerToken(request: Request): string {
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Falta el token de acceso');
    }
    return token;
  }

  private async validatePermission(token: string, url: string, method: string): Promise<PermissionValidationResponse> {
    const securityUrl = this.configService.get<string>('MS_SECURITY');
    if (!securityUrl) {
      this.logger.error('La variable MS_SECURITY no está configurada');
      throw new ServiceUnavailableException('El servicio de seguridad no está configurado');
    }

    // Identifica a este ms ante seguridad (además del JWT del usuario)
    const internalKey = this.configService.get<string>('INTERNAL_SERVICE_KEY');
    if (!internalKey) {
      this.logger.error('La variable INTERNAL_SERVICE_KEY no está configurada');
      throw new ServiceUnavailableException('El servicio de seguridad no está configurado');
    }

    try {
      const { data } = await axios.post<PermissionValidationResponse>(
        `${securityUrl}${PERMISSIONS_VALIDATION_PATH}`,
        { url, method },
        {
          headers: { Authorization: `Bearer ${token}`, [INTERNAL_KEY_HEADER]: internalKey },
          timeout: REQUEST_TIMEOUT_MS,
        },
      );
      return { allowed: data.allowed === true, userId: data.userId ?? null };
    } catch (error) {
      throw this.translateSecurityError(error);
    }
  }

  // Traduce la respuesta del ms de seguridad: 401 y 403 se respetan, el resto es indisponibilidad
  private translateSecurityError(error: unknown): Error {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 401) {
      return new UnauthorizedException('Tu sesión no es válida o expiró');
    }
    // Seguridad responde 200 { allowed: false } cuando falta el permiso; un 403 aquí es la clave interna rechazada
    if (status === 403) {
      this.logger.error('Seguridad rechazó la clave interna (INTERNAL_SERVICE_KEY distinta en ambos ms)');
      return new ServiceUnavailableException('El servicio de seguridad no está configurado');
    }
    this.logger.error(`No se pudo validar el permiso: ${(error as Error).message}`);
    return new ServiceUnavailableException('No se pudo contactar al servicio de seguridad');
  }
}
