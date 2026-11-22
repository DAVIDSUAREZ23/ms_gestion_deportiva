import { IsEnum, IsInt, IsNumber, Max, Min } from 'class-validator';
import { MAX_BET_AMOUNT, MIN_BET_AMOUNT } from '../bets.constants';
import { BetSelection } from '../entities/match-odd.entity';

// El aficionado sale del JWT; el monto, la cuota y la ganancia los calcula el servidor
export class CreateBetDto {
  @IsInt({ message: 'El partido debe ser un id numérico' })
  @Min(1, { message: 'El partido debe ser un id válido' })
  matchId!: number;

  @IsEnum(BetSelection, { message: 'La selección debe ser HOME, DRAW o AWAY' })
  selection!: BetSelection;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número con máximo dos decimales' })
  @Min(MIN_BET_AMOUNT, { message: `El monto mínimo por apuesta es ${MIN_BET_AMOUNT} COP` })
  @Max(MAX_BET_AMOUNT, { message: `El monto máximo por apuesta es ${MAX_BET_AMOUNT} COP` })
  amount!: number;

  @IsInt({ message: 'El método de pago debe ser un id numérico' })
  @Min(1, { message: 'El método de pago debe ser un id válido' })
  paymentMethodId!: number;

  @IsInt({ message: 'La pasarela debe ser un id numérico' })
  @Min(1, { message: 'La pasarela debe ser un id válido' })
  paymentGatewayId!: number;
}
