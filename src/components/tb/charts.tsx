import { motion } from "framer-motion";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Clock } from "lucide-react";
import { useTable } from "@/lib/db";
import { useCurrency } from "@/lib/currency";
import { platformLabel } from "@/lib/entities";
import { rates, useMetrics } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { activitySentence, timeAgo, useRecords } from "./records";

export function ProfitHeatmap() {
  const { series } = useMetrics();
  const { fmt } = useCurrency();
  const data = series.slice(-30);
  const max = Math.max(1, ...data.map((d) => Math.abs(d.profit)));
  const total = data.reduce((a, d) => a + d.profit, 0);
  const [hover, setHover] = useState<number | null>(null);
  const h = hover !== null ? data[hover] : null;
  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="font-display text-base font-semibold">Profit Heatmap</h3>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>
        <div className="text-right">
          <div className="tnum font-display text-xl font-semibold text-gold-gradient">{fmt(total)}</div>
          <div className="tnum h-4 text-xs text-muted-foreground">
            {h ? `${new Date(h.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${fmt(h.profit)}` : "Monthly total"}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {data.map((d, i) => {
          const intensity = d.profit === 0 ? 0.08 : 0.15 + (Math.abs(d.profit) / max) * 0.85;
          return (
            <motion.button
              key={d.date}
              aria-label={`${d.date}: ${fmt(d.profit)}`}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)}
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.015 }}
              className={cn("aspect-square rounded-[8px] transition-transform hover:scale-110", hover === i && "ring-2 ring-gold")}
              style={{ background: `color-mix(in oklab, ${d.profit >= 0 ? "var(--gold)" : "var(--danger)"} ${Math.round(intensity * 100)}%, transparent)` }}
            />
          );
        })}
      </div>
    </div>
  );
}

const ranges = { "7D": 7, "30D": 30, "90D": 90 } as const;

export function ProfitChart() {
  const [range, setRange] = useState<keyof typeof ranges>("30D");
  const { series } = useMetrics();
  const { fmt, fromUSD } = useCurrency();
  const data = series.slice(-ranges[range]).map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), v: fromUSD(d.profit) }));
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Profit</h3>
        <div className="relative flex rounded-full border p-0.5">
          {(Object.keys(ranges) as (keyof typeof ranges)[]).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={cn("relative h-8 rounded-full px-3 text-xs font-medium", range === r ? "text-primary-foreground" : "text-muted-foreground")}>
              {range === r && <motion.span layoutId="range-pill" className="absolute inset-0 rounded-full bg-gold-gradient" />}
              <span className="relative">{r}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -10, right: 4, top: 8 }}>
            <defs>
              <linearGradient id="pf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
              </linearGradient>
              <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)))} />
            <Tooltip
              cursor={{ stroke: "var(--gold)", strokeOpacity: 0.3 }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="glass rounded-[14px] px-3 py-2 text-xs shadow-glow">
                    <div className="text-muted-foreground">{payload[0]!.payload.label}</div>
                    <div className="tnum font-display text-sm font-semibold text-gold">{fmt(payload[0]!.payload.profit)}</div>
                  </div>
                ) : null
              }
            />
            <Area key={range} type="monotone" dataKey="v" stroke="var(--gold)" strokeWidth={2.25} fill="url(#pf)" filter="url(#glow)" animationDuration={1200} activeDot={{ r: 5, fill: "var(--gold)", stroke: "var(--background)", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AccountsHealth() {
  const accounts = useTable("ad_accounts").filter((a) => !a.archived);
  const { alerts } = useMetrics();
  const { open } = useRecords();
  const platforms = ["tiktok", "google", "snapchat", "facebook"];
  return (
    <div>
      <h3 className="mb-4 font-display text-base font-semibold">Accounts Health</h3>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {platforms.map((p) => {
          const rows = accounts.filter((a) => a.platform === p);
          const c = (s: string) => rows.filter((a) => a.status === s).length;
          return (
            <div key={p} className="rounded-[18px] border bg-background/40 p-3">
              <div className="text-sm font-medium">{platformLabel[p]}</div>
              <div className="tnum mt-2 flex gap-3 text-xs">
                <span className="flex items-center gap-1" title="Active"><span className="h-1.5 w-1.5 rounded-full bg-success" />{c("active")}</span>
                <span className="flex items-center gap-1" title="Restricted"><span className="h-1.5 w-1.5 rounded-full bg-warning" />{c("restricted")}</span>
                <span className="flex items-center gap-1" title="Disabled"><span className="h-1.5 w-1.5 rounded-full bg-danger" />{c("disabled")}</span>
              </div>
            </div>
          );
        })}
      </div>
      {alerts.map((e) => (
        <button key={e.id} onClick={() => open(e.entity.type as "ad_accounts", e.entity.id)} className={cn("mt-2 flex w-full items-center gap-3 rounded-[14px] border px-3 py-2.5 text-left text-sm", e.level === "danger" ? "border-danger/30 bg-danger/5" : "border-warning/30 bg-warning/5")}>
          <AlertTriangle className={cn("h-4 w-4 shrink-0", e.level === "danger" ? "text-danger" : "text-warning")} />
          <span className="flex-1 truncate">{e.label}</span>
          {e.daysLeft !== undefined && <span className={cn("tnum text-xs", e.level === "danger" ? "text-danger" : "text-warning")}>{e.daysLeft < 0 ? "expired" : `${e.daysLeft}d left`}</span>}
        </button>
      ))}
    </div>
  );
}

export function OrderFunnel() {
  const { windowTotals } = useMetrics();
  const r = rates(windowTotals);
  const items = [
    { label: "Confirmation", v: r.confirmation, sub: `${windowTotals.confirmed} / ${windowTotals.orders}` },
    { label: "Delivery", v: r.delivery, sub: `${windowTotals.delivered} / ${windowTotals.confirmed}` },
    { label: "Returns", v: r.returns, sub: `${windowTotals.returned} returned`, bad: true },
  ];
  return (
    <div>
      <h3 className="mb-4 font-display text-base font-semibold">Order funnel <span className="text-xs font-normal text-muted-foreground">· 30D</span></h3>
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={it.label}>
            <div className="mb-1.5 flex justify-between text-xs"><span>{it.label}</span><span className="tnum text-muted-foreground">{it.sub} · <span className={it.bad ? "text-danger" : "text-gold"}>{Math.round(it.v * 100)}%</span></span></div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div className={cn("h-full rounded-full", it.bad ? "bg-danger" : "bg-gold-gradient")} initial={{ width: 0 }} animate={{ width: `${it.v * 100}%` }} transition={{ duration: 1.1, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const log = useTable("activity_log").slice(0, limit);
  const { open } = useRecords();
  return (
    <div>
      <h3 className="mb-4 font-display text-base font-semibold">Activity</h3>
      {log.length === 0 ? <p className="text-sm text-muted-foreground">Changes you make anywhere will appear here.</p> : (
        <ul className="space-y-2.5">
          {log.map((a) => { const s = activitySentence(a); return (
            <li key={a.id}>
              <button disabled={a.action === "delete" || !a.entity_id} onClick={() => open(a.entity_type, a.entity_id)} className="flex w-full items-start gap-2 text-left text-xs hover:text-gold disabled:hover:text-inherit">
                <Clock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="flex-1"><span className="font-medium">{s.who}</span> {s.verb} {s.what}{s.detail ? ` · ${s.detail}` : ""}</span>
                <span className="tnum shrink-0 text-muted-foreground">{timeAgo(a.created_at)}</span>
              </button>
            </li>
          ); })}
        </ul>
      )}
    </div>
  );
}
