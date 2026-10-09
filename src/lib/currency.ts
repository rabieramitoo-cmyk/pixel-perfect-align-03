import { useTable } from "./db";

/** All money is stored in USD; display and input use the owner's chosen currency. */
export const RATES_TO_USD: Record<string, number> = { USD: 1, EUR: 1.087, MAD: 0.1, SAR: 0.2667 };
export const CURRENCIES = ["USD", "EUR", "MAD"] as const;
export type Currency = (typeof CURRENCIES)[number];
const SYMBOL: Record<Currency, string> = { USD: "$", EUR: "€", MAD: "MAD " };

export const toUSD = (amount: number, cur: string) => amount * (RATES_TO_USD[cur] ?? 1);

export function useCurrency() {
  const s = useTable("user_settings")[0];
  const cur = ((s?.currency as Currency) ?? "USD") as Currency;
  const rate = RATES_TO_USD[cur] ?? 1;
  const fromUSD = (v: number) => v / rate;
  const fmt = (usd: number, compact = false) => {
    const v = fromUSD(usd);
    const n = new Intl.NumberFormat("en-US", compact ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: 0 }).format(Math.abs(v));
    return (v < 0 ? "-" : "") + SYMBOL[cur] + n;
  };
  return { cur, symbol: SYMBOL[cur], fromUSD, toUSD: (v: number) => v * rate, fmt };
}
