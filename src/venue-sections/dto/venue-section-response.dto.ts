import { VenueSummaryDto } from '../../venues/dto/venue-response.dto';

// Datos mínimos de una localidad para mostrarla dentro de un boleto
export class VenueSectionSummaryDto {
  id!: number;
  name!: string;
  price!: number;
}

export class VenueSectionResponseDto extends VenueSectionSummaryDto {
  venue!: VenueSummaryDto;
  capacity!: number;
  active!: boolean;
}
