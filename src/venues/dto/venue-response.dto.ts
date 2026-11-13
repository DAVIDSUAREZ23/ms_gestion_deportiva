// Datos mínimos de un escenario para mostrarlo dentro de un partido
export class VenueSummaryDto {
  id!: number;
  name!: string;
  city!: string | null;
}

export class VenueResponseDto extends VenueSummaryDto {
  capacity!: number | null;
  active!: boolean;
}
