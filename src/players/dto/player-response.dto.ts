// Datos mínimos de un jugador para mostrarlo dentro de otros recursos
export class PlayerSummaryDto {
  id!: number;
  documentNumber!: string;
  fullName!: string;
  position!: string | null;
  active!: boolean;
}

export class PlayerResponseDto extends PlayerSummaryDto {
  firstName!: string;
  lastName!: string;
  birthDate!: string;
  nationality!: string | null;
  email!: string | null;
  phone!: string | null;
}
