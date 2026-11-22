// Contrato de la pasarela de pagos. En el Paso 2 se usa una implementación simulada;
// en el Paso 3 se reemplaza por Wompi, PayU u otra sin tocar el servicio de monederos.
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export type PaymentChargeRequest = {
  // Referencia única del cobro, p. ej. RC-9F3A61C2
  reference: string;
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
