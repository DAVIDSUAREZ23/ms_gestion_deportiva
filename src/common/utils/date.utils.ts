// Fecha local en formato AAAA-MM-DD, comparable como texto con las columnas DATE
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Fecha local de hoy en formato AAAA-MM-DD
export function todayIsoDate(): string {
  return toIsoDate(new Date());
}
