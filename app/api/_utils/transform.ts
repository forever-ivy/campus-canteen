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
    const parsed = Number(value.replace(/[,\s]/g, ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  // 强化对 Prisma Decimal 的处理
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;

    // 1) 优先使用 toNumber()
    if (typeof (obj as { toNumber?: unknown }).toNumber === "function") {
      const n = (obj as { toNumber: () => number }).toNumber();
      return Number.isFinite(n) ? n : 0;
    }

    // 2) 尝试 valueOf()
    if (typeof (obj as { valueOf?: unknown }).valueOf === "function") {
      const v = (obj as { valueOf: () => unknown }).valueOf();
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string") {
        const parsed = Number(v.replace(/[,\s]/g, ""));
        return Number.isNaN(parsed) ? 0 : parsed;
      }
    }

    // 3) 退回到 toString()
    if (typeof (obj as { toString?: unknown }).toString === "function") {
      const s = (obj as { toString: () => string }).toString();
      const parsed = Number(s.replace(/[,\s]/g, ""));
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    // 4) 兜底：识别 Decimal 构造名
    if (
      (obj as { constructor?: { name?: string } }).constructor?.name ===
      "Decimal"
    ) {
      const parsed = Number(String(obj));
      return Number.isNaN(parsed) ? 0 : parsed;
    }
  }

  // 最后兜底
  const n = Number(value as number);
  return Number.isNaN(n) ? 0 : n;
};

export const toCurrency = (
  value: unknown,
  symbol = "¥",
  digits = 2
): string => {
  const amount = toNumber(value);
  const formatted = Number.isFinite(amount)
    ? amount.toFixed(digits)
    : (0).toFixed(digits);
  return `${symbol}${formatted}`;
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

export const parseDateParam = (
  value: string | null | undefined
): Date | null => {
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
