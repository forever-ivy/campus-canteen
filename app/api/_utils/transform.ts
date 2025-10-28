type DecimalLike = {
  toNumber: () => number;
};

const isDecimalLike = (value: unknown): value is DecimalLike =>
  typeof value === "object" &&
  value !== null &&
  "toNumber" in (value as Record<string, unknown>) &&
  typeof (value as { toNumber?: unknown }).toNumber === "function";

export const toNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (isDecimalLike(value)) {
    return Number(value.toNumber());
  }
  return Number(value);
};

export const toCurrency = (value: unknown, digits = 2): number => {
  const amount = toNumber(value);
  if (!Number.isFinite(amount)) return 0;
  return Number(amount.toFixed(digits));
};

export const toBigIntString = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toString" in value &&
    typeof (value as { toString: () => string }).toString === "function"
  ) {
    return (value as { toString: () => string }).toString();
  }
  return null;
};

export const parseDateParam = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date: Date): Date => {
  const d = startOfDay(date);
  d.setDate(d.getDate() + 1);
  return d;
};

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
