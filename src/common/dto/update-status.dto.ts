import { IsBoolean } from 'class-validator';

// Activar o desactivar un registro de catálogo (deporte, equipo, jugador o habilidad)
export class UpdateStatusDto {
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  active!: boolean;
}
