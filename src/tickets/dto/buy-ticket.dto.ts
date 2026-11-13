import { IsInt, Min } from 'class-validator';

// El aficionado sale del JWT; solo se elige el partido y la localidad
export class BuyTicketDto {
  @IsInt({ message: 'El partido debe ser un id numérico' })
  @Min(1, { message: 'El partido debe ser un id válido' })
  matchId!: number;

  @IsInt({ message: 'La localidad debe ser un id numérico' })
  @Min(1, { message: 'La localidad debe ser un id válido' })
  sectionId!: number;
}
