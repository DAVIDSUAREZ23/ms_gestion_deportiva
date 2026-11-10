// Datos mínimos de un deporte para mostrarlo dentro de otros recursos
export class SportSummaryDto {
  id!: number;
  name!: string;
  active!: boolean;
}

export class SportResponseDto extends SportSummaryDto {
  description!: string | null;
  parentId!: number | null;
  parentName!: string | null;
}

// Detalle de un deporte con sus subdeportes
export class SportDetailResponseDto extends SportResponseDto {
  subSports!: SportSummaryDto[];
}
