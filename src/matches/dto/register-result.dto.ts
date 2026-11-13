import { IsInt, Max, Min } from 'class-validator';

// Marcador oficial del partido: solo para los dos equipos participantes
export class RegisterResultDto {
  @IsInt({ message: 'El marcador local debe ser un número entero' })
  @Min(0, { message: 'El marcador local no puede ser negativo' })
  @Max(999, { message: 'El marcador local no puede superar 999' })
  homeScore!: number;

  @IsInt({ message: 'El marcador visitante debe ser un número entero' })
  @Min(0, { message: 'El marcador visitante no puede ser negativo' })
  @Max(999, { message: 'El marcador visitante no puede superar 999' })
  awayScore!: number;
}
