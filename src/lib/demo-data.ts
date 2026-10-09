// Demo data — replace each export with real queries later. Shapes are the contract.
export type DayProfit = { date: string; profit: number; revenue: number; spend: number };
export type Kpi = { key: string; label: string; value: number; prev: number; format: "sar" | "x"; spark: number[] };
export type PlatformHealth = { platform: string; active: number; restricted: number; banned: number };
export type ExpiringItem = { id: string; label: string; platform: string; daysLeft: number };

function seeded(n: number) {
  let s = n;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export function getProfitHistory(days = 90): DayProfit[] {
  const r = seeded(42);
  const out: DayProfit[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const spend = Math.round(3500 + r() * 3000);
    const revenue = Math.round(spend * (1.4 + r() * 1.6));
    const profit = Math.round(revenue * 0.38 - spend * 0.55 + (r() - 0.25) * 1800);
    out.push({ date: d.toISOString().slice(0, 10), profit, revenue, spend });
  }
  return out;
}

export function getKpis(): Kpi[] {
  const h = getProfitHistory(14);
  const t = h[h.length - 1]!, y = h[h.length - 2]!;
  const roas = (x: DayProfit) => +(x.revenue / x.spend).toFixed(2);
  return [
    { key: "spend", label: "Ad Spend Today", value: t.spend, prev: y.spend, format: "sar", spark: h.map((x) => x.spend) },
    { key: "revenue", label: "Revenue Today", value: t.revenue, prev: y.revenue, format: "sar", spark: h.map((x) => x.revenue) },
    { key: "profit", label: "Net Profit Today", value: t.profit, prev: y.profit, format: "sar", spark: h.map((x) => x.profit) },
    { key: "roas", label: "ROAS", value: roas(t), prev: roas(y), format: "x", spark: h.map(roas) },
  ];
}

export function getStreak(): number {
  const h = getProfitHistory(90);
  let s = 0;
  for (let i = h.length - 1; i >= 0 && h[i]!.profit > 0; i--) s++;
  return s;
}

export const platformHealth: PlatformHealth[] = [
  { platform: "TikTok", active: 12, restricted: 2, banned: 1 },
  { platform: "Google Ads", active: 6, restricted: 0, banned: 0 },
  { platform: "Snapchat", active: 8, restricted: 1, banned: 0 },
  { platform: "Facebook", active: 4, restricted: 1, banned: 2 },
];

export const expiring: ExpiringItem[] = [
  { id: "1", label: "TikTok BM — Riyadh Store card", platform: "TikTok", daysLeft: 3 },
  { id: "2", label: "Snapchat ad account verification", platform: "Snapchat", daysLeft: 6 },
];

export const brands = [
  { name: "Oud Royale", color: "brand-4" },
  { name: "Najd Home", color: "brand-1" },
  { name: "Lumi Skin", color: "brand-2" },
  { name: "Sahara Tech", color: "brand-3" },
];

export const defaultTasks = [
  { title: "Check overnight COD confirmations", brand: "Oud Royale", priority: "high" },
  { title: "Kill campaigns under 1.5 ROAS", brand: "Lumi Skin", priority: "high" },
  { title: "Launch 3 new TikTok creatives", brand: "Najd Home", priority: "medium" },
  { title: "Reconcile courier remittance", brand: "Oud Royale", priority: "medium" },
  { title: "Reply to supplier on restock", brand: "Sahara Tech", priority: "low" },
  { title: "Duplicate winning ad set ×2 budget", brand: "Lumi Skin", priority: "high" },
];

export const fmtSAR = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
