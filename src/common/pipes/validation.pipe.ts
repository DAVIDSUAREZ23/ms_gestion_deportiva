import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

// ValidationPipe global: rechaza campos extra y devuelve los errores por campo en "details"
export function buildValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestException({
        message: 'Datos de entrada no válidos',
        details: toFieldErrors(errors),
      }),
  });
}

// Convierte los errores de class-validator en { campo: primer mensaje }
function toFieldErrors(errors: ValidationError[]): Record<string, string> {
  return Object.fromEntries(
    errors.map((error) => [
      error.property,
      Object.values(error.constraints ?? {})[0] ?? 'Valor no válido',
    ]),
  );
}
