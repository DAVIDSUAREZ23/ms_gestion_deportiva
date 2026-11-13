import { ValueTransformer } from 'typeorm';

// MySQL devuelve las columnas DECIMAL como texto; se convierten a número al leer
export const DecimalTransformer: ValueTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};
