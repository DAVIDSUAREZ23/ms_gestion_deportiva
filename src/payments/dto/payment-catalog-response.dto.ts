// Método de pago visto desde una apuesta
export class PaymentMethodSummaryDto {
  id!: number;
  code!: string;
  name!: string;
}

// Pasarela vista desde una apuesta
export class PaymentGatewaySummaryDto {
  id!: number;
  code!: string;
  name!: string;
}

export class PaymentMethodResponseDto extends PaymentMethodSummaryDto {
  active!: boolean;
}

export class PaymentGatewayResponseDto extends PaymentGatewaySummaryDto {
  active!: boolean;
  sandbox!: boolean;
}
