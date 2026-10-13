import { useMemo, useSyncExternalStore } from "react";
import { riyadhDate } from "./db";

/** One global date range for the whole app. Dates are plain "YYYY-MM-DD" strings in the app's "today" timezone. */
export type RangeKey = "today" | "yesterday" | "7d" | "14d" | "30d" | "90d" | "month" | "lastMonth" | "year" | "all" | "custom";
export type RangeState = { key: RangeKey; from?: string; to?: string };

export type Bounds = {
  key: RangeKey;
  /** First day included, or null for "all time". */
  from: string | null;
  /** Last day included. */
  to: string;
  /** Compact label for cards, e.g. "30D", "This month". */
  short: string;
  /** The actual dates, e.g. "14 Sep – 13 Oct". */
  dates: string;
};

const KEYS: RangeKey[] = ["today", "yesterday", "7d", "14d", "30d", "90d", "month", "lastMonth", "year", "all", "custom"];
const DEFAULT: RangeState = { key: "30d" };
const STORAGE_KEY = "tb-range";
const DAY = 86400000;

// ---- date helpers (UTC arithmetic on date strings, so no timezone or DST surprises) ----
const toMs = (d: string) => Date.parse(d + "T00:00:00Z");
const fromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (d: string, n: number) => fromMs(toMs(d) + n * DAY);
export const diffDays = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / DAY);
const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(toMs(s));
const short = (d: string) => new Date(toMs(d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const describe = (from: string, to: string) => (from === to ? short(from) : `${short(from)} – ${short(to)}`);

export function resolveRange(s: RangeState, today: string): Bounds {
  const rolling = (n: number, label: string): Bounds => {
    const from = addDays(today, -(n - 1));
    return { key: s.key, from, to: today, short: label, dates: describe(from, today) };
  };
  const y = Number(today.slice(0, 4)), m = Number(today.slice(5, 7)) - 1;
  switch (s.key) {
    case "today": return { key: s.key, from: today, to: today, short: "Today", dates: describe(today, today) };
    case "yesterday": { const d = addDays(today, -1); return { key: s.key, from: d, to: d, short: "Yesterday", dates: describe(d, d) }; }
    case "7d": return rolling(7, "7D");
    case "14d": return rolling(14, "14D");
    case "30d": return rolling(30, "30D");
    case "90d": return rolling(90, "90D");
    case "month": { const from = `${today.slice(0, 8)}01`; return { key: s.key, from, to: today, short: "This month", dates: describe(from, today) }; }
    case "lastMonth": {
      const from = fromMs(Date.UTC(y, m - 1, 1)), to = fromMs(Date.UTC(y, m, 0));
      return { key: s.key, from, to, short: "Last month", dates: describe(from, to) };
    }
    case "year": { const from = `${y}-01-01`; return { key: s.key, from, to: today, short: "This year", dates: describe(from, today) }; }
    case "all": return { key: s.key, from: null, to: today, short: "All time", dates: "All time" };
    case "custom": {
      const to = s.to && s.to <= today ? s.to : today;
      const from = s.from && s.from <= to ? s.from : to;
      return { key: s.key, from, to, short: describe(from, to), dates: describe(from, to) };
    }
  }
}

/** The period of equal length right before `from`, used for "vs previous period" deltas. */
export function previousBounds(from: string, to: string) {
  const n = diffDays(from, to) + 1;
  return { from: addDays(from, -n), to: addDays(from, -1) };
}

export const compareLabel = (key: RangeKey) => (key === "today" ? "vs yesterday" : key === "yesterday" ? "vs day before" : key === "all" ? "" : "vs previous period");

// ---- tiny external store, persisted in localStorage ----
let state: RangeState = DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();

function parse(raw: string): RangeState | null {
  try {
    const v = JSON.parse(raw);
    if (!v || !KEYS.includes(v.key)) return null;
    if (v.key === "custom") return isDate(v.from) && isDate(v.to) && v.from <= v.to ? { key: "custom", from: v.from, to: v.to } : null;
    return { key: v.key };
  } catch { return null; }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const p = raw ? parse(raw) : null;
    if (p) state = p;
  } catch { /* storage unavailable: keep the default */ }
}

const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const getSnapshot = () => { load(); return state; };
const getServerSnapshot = () => DEFAULT;

export function setRange(next: RangeState) {
  state = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function useRange() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const today = riyadhDate();
  const bounds = useMemo(() => resolveRange(s, today), [s, today]);
  return { state: s, bounds, today, setRange };
}
