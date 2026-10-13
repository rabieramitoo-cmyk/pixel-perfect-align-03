import { useMemo } from "react";
import { useTable, type Row } from "./db";
import { RATES_TO_USD } from "./currency";
import { addDays, diffDays, previousBounds, useRange } from "./range";

export type Day = { date: string; revenue: number; spend: number; expenses: number; profit: number; orders: number; confirmed: number; delivered: number; returned: number };
export type Totals = { spend: number; revenue: number; expenses: number; profit: number; orders: number; confirmed: number; delivered: number; returned: number };

const zero = (): Totals => ({ spend: 0, revenue: 0, expenses: 0, profit: 0, orders: 0, confirmed: 0, delivered: 0, returned: 0 });
const num = (v: unknown) => Number(v) || 0;

export const rates = (t: Pick<Totals, "orders" | "confirmed" | "delivered" | "returned">) => ({
  confirmation: t.orders ? t.confirmed / t.orders : 0,
  delivery: t.confirmed ? t.delivered / t.confirmed : 0,
  returns: t.confirmed ? t.returned / t.confirmed : 0,
});

const MAX_SERIES_DAYS = 730;
const MIN_SERIES_DAYS = 7;
const HEAT_MIN = 14;
const HEAT_MAX = 90;

/** Every number in the app is derived here from raw rows. Nothing is typed twice. */
export function useMetrics() {
  const { bounds, today } = useRange();
  const accounts = useTable("ad_accounts");
  const campaigns = useTable("campaigns");
  const daily = useTable("campaign_daily");
  const orders = useTable("orders_daily");
  const expenses = useTable("expenses");
  const cc = useTable("campaign_creatives");
  const brands = useTable("brands");

  return useMemo(() => {
    const since = bounds.from ?? "";
    const accById = new Map(accounts.map((a) => [a.id, a]));
    const campById = new Map(campaigns.map((c) => [c.id, c]));

    const days = new Map<string, Day>();
    const day = (d: string) => {
      let x = days.get(d);
      if (!x) { x = { date: d, ...zero() }; days.set(d, x); }
      return x;
    };
    const perBrand = new Map<string, Totals>();
    const perAccount = new Map<string, Totals>();
    const perCampaign = new Map<string, Totals>();
    const bucket = (m: Map<string, Totals>, k: string | null | undefined) => {
      if (!k) return null;
      let x = m.get(k);
      if (!x) { x = zero(); m.set(k, x); }
      return x;
    };
    const inWindow = (d: string) => d >= since && d <= bounds.to;

    for (const r of daily) {
      const s = num(r.spend), rev = num(r.revenue);
      day(r.day).spend += s;
      if (!inWindow(r.day)) continue;
      const c = campById.get(r.campaign_id);
      const pc = bucket(perCampaign, r.campaign_id); if (pc) { pc.spend += s; pc.revenue += rev; }
      const pa = bucket(perAccount, c?.ad_account_id); if (pa) { pa.spend += s; pa.revenue += rev; }
      const pb = bucket(perBrand, c?.brand_id); if (pb) pb.spend += s;
    }
    for (const o of orders) {
      const rev = num(o.revenue) * (RATES_TO_USD[o.currency] ?? 1);
      const d = day(o.day);
      d.revenue += rev; d.orders += num(o.orders); d.confirmed += num(o.confirmed); d.delivered += num(o.delivered); d.returned += num(o.returned);
      if (!inWindow(o.day)) continue;
      const pb = bucket(perBrand, o.brand_id);
      if (pb) { pb.revenue += rev; pb.orders += num(o.orders); pb.confirmed += num(o.confirmed); pb.delivered += num(o.delivered); pb.returned += num(o.returned); }
    }
    for (const e of expenses) {
      const a = num(e.amount);
      day(e.day).expenses += a;
      if (!inWindow(e.day)) continue;
      const pb = bucket(perBrand, e.brand_id); if (pb) pb.expenses += a;
      const pa = bucket(perAccount, e.ad_account_id); if (pa) pa.expenses += a;
      const pc = bucket(perCampaign, e.campaign_id); if (pc) pc.expenses += a;
    }
    for (const m of [perBrand, perAccount, perCampaign]) for (const t of m.values()) t.profit = t.revenue - t.spend - t.expenses;

    const perPlatform = new Map<string, Totals>();
    for (const [id, t] of perAccount) {
      const p = bucket(perPlatform, accById.get(id)?.platform ?? "other")!;
      p.spend += t.spend; p.revenue += t.revenue; p.expenses += t.expenses; p.profit += t.profit;
    }

    const finish = (x: Day) => { x.profit = x.revenue - x.spend - x.expenses; return x; };
    const dayOf = (d: string) => finish(days.get(d) ?? { date: d, ...zero() });
    const sumRange = (from: string, to: string) => {
      const a = zero();
      for (const d of days.values()) {
        if (d.date < from || d.date > to) continue;
        const x = finish(d);
        a.spend += x.spend; a.revenue += x.revenue; a.expenses += x.expenses; a.profit += x.profit;
        a.orders += x.orders; a.confirmed += x.confirmed; a.delivered += x.delivered; a.returned += x.returned;
      }
      return a;
    };
    const continuous = (from: string, to: string) => {
      const out: Day[] = [];
      for (let d = from; d <= to; d = addDays(d, 1)) out.push(dayOf(d));
      return out;
    };

    // Earliest day with any data, for "All time"
    let earliest = bounds.to;
    for (const k of days.keys()) if (k < earliest) earliest = k;
    const rangeFrom = bounds.from ?? earliest;
    const spanFrom = addDays(bounds.to, -(MAX_SERIES_DAYS - 1));
    const effFrom = rangeFrom < spanFrom ? spanFrom : rangeFrom;

    const windowTotals = sumRange(rangeFrom, bounds.to);
    const prev = bounds.from ? previousBounds(bounds.from, bounds.to) : null;
    const previousTotals = prev ? sumRange(prev.from, prev.to) : zero();

    // Range series for charts (padded to a week so a single day still draws a line)
    const len = diffDays(effFrom, bounds.to) + 1;
    const series = continuous(len < MIN_SERIES_DAYS ? addDays(bounds.to, -(MIN_SERIES_DAYS - 1)) : effFrom, bounds.to);
    const heatLen = Math.min(HEAT_MAX, Math.max(HEAT_MIN, len));
    const heatDays = continuous(addDays(bounds.to, -(heatLen - 1)), bounds.to);

    // Streak always counts back from the app's real today, independent of the chosen range
    let streak = 0;
    for (let i = 0; i < 400; i++) {
      const d = dayOf(addDays(today, -i));
      if (d.revenue === 0 && d.spend === 0) { if (i === 0) continue; break; }
      if (d.profit > 0) streak++; else break;
    }

    // Dependency flags
    const campaignFlag = (c: Row | undefined): string | null => {
      if (!c) return null;
      if (c.status === "killed") return "Campaign killed";
      const a = accById.get(c.ad_account_id);
      if (a?.status === "disabled") return "Account disabled";
      return null;
    };
    const flaggedCampaigns = new Map<string, string>();
    for (const c of campaigns) { const f = campaignFlag(c); if (f) flaggedCampaigns.set(c.id, f); }
    const flaggedCreatives = new Map<string, string>();
    for (const l of cc) {
      const f = flaggedCampaigns.get(l.campaign_id);
      if (f) flaggedCreatives.set(l.creative_id, `${f} · ${campById.get(l.campaign_id)?.name ?? ""}`);
    }

    // Alerts
    const alerts: { id: string; kind: "spanda" | "status" | "flag"; label: string; level: "warning" | "danger"; entity: { type: string; id: string }; daysLeft?: number }[] = [];
    const todayMs = new Date(today).getTime();
    for (const a of accounts) {
      if (a.archived) continue;
      if (a.spanda_expires_at && a.status !== "disabled") {
        const left = Math.round((new Date(a.spanda_expires_at).getTime() - todayMs) / 86400000);
        if (left <= 7) alerts.push({ id: "sp" + a.id, kind: "spanda", label: `Spanda plan for ${a.name} ${left < 0 ? "expired" : "expires"}`, level: left <= 3 ? "danger" : "warning", entity: { type: "ad_accounts", id: a.id }, daysLeft: left });
      }
      if (a.status === "disabled" || a.status === "restricted") {
        const deps = campaigns.filter((c) => c.ad_account_id === a.id).length;
        alerts.push({ id: "st" + a.id, kind: "status", label: `${a.name} is ${a.status}${deps ? ` · ${deps} campaign${deps > 1 ? "s" : ""} affected` : ""}`, level: a.status === "disabled" ? "danger" : "warning", entity: { type: "ad_accounts", id: a.id } });
      }
    }
    for (const [id, why] of flaggedCampaigns) {
      const c = campById.get(id);
      if (c && why === "Account disabled" && c.status !== "killed") alerts.push({ id: "fl" + id, kind: "flag", label: `${c.name} runs on a disabled account`, level: "danger", entity: { type: "campaigns", id } });
    }

    const brandName = new Map(brands.map((b) => [b.id, b.name]));
    return { today, range: bounds, series, heatDays, windowTotals, previousTotals, perBrand, perAccount, perCampaign, perPlatform, streak, flaggedCampaigns, flaggedCreatives, alerts, brandName };
  }, [accounts, campaigns, daily, orders, expenses, cc, brands, bounds, today]);
}

export const totalsOf = (m: Map<string, Totals>, id: string) => m.get(id) ?? zero();
