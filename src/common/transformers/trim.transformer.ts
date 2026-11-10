import { Transform } from 'class-transformer';

// Quita espacios al inicio y al final; un texto vacío opcional se guarda como null
export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export const TrimToNull = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });
