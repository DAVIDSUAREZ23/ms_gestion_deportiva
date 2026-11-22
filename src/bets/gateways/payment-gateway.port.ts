// Contrato de la pasarela de pagos. En el Paso 2 se usa una implementación simulada;
// en el Paso 3 se reemplaza por Wompi, PayU u otra sin tocar el servicio de apuestas.
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export type PaymentChargeRequest = {
  betCode: string;
  amount: number;
  paymentMethodCode: string;
  gatewayCode: string;
};

export type PaymentChargeResult = {
  approved: boolean;
  // Referencia única del intento de cobro
  reference: string;
};

export interface PaymentGatewayPort {
  charge(request: PaymentChargeRequest): Promise<PaymentChargeResult>;
}
