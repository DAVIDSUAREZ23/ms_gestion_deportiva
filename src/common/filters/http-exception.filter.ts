import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

type ErrorBody = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  details?: Record<string, string>;
};

// Errores de MySQL que indican un conflicto de datos (duplicado o registro referenciado)
const MYSQL_CONFLICT_CODES = new Set(['ER_DUP_ENTRY', 'ER_ROW_IS_REFERENCED_2']);

// Responde todos los errores con el mismo formato del ms de seguridad para que el frontend los lea igual
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const body = this.toErrorBody(exception);
    host.switchToHttp().getResponse<Response>().status(body.status).json(body);
  }

  private toErrorBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }
    if (this.isMysqlConflict(exception)) {
      return this.build(HttpStatus.CONFLICT, 'La operación entra en conflicto con datos existentes');
    }
    this.logger.error(exception);
    return this.build(HttpStatus.INTERNAL_SERVER_ERROR, 'Ocurrió un error inesperado');
  }

  private fromHttpException(exception: HttpException): ErrorBody {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return this.build(exception.getStatus(), response);
    }
    const { message, details } = response as { message?: string | string[]; details?: Record<string, string> };
    const text = Array.isArray(message) ? message.join(', ') : (message ?? exception.message);
    return this.build(exception.getStatus(), text, details);
  }

  private isMysqlConflict(exception: unknown): boolean {
    const code = (exception as QueryFailedError & { driverError?: { code?: string } })?.driverError?.code;
    return exception instanceof QueryFailedError && MYSQL_CONFLICT_CODES.has(code ?? '');
  }

  private build(status: number, message: string, details?: Record<string, string>): ErrorBody {
    return {
      timestamp: new Date().toISOString(),
      status,
      error: HttpStatus[status] ?? 'ERROR',
      message,
      ...(details && { details }),
    };
  }
}
