// Redondea a dos decimales (centavos) evitando los errores de coma flotante
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
