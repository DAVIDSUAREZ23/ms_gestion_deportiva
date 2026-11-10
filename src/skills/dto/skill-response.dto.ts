// Datos mínimos de una habilidad para mostrarla dentro de otros recursos
export class SkillSummaryDto {
  id!: number;
  name!: string;
  active!: boolean;
}

export class SkillResponseDto extends SkillSummaryDto {
  description!: string | null;
}
