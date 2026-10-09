import { motion } from "framer-motion";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle } from "lucide-react";
import { expiring, fmtSAR, getProfitHistory, platformHealth } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function ProfitHeatmap() {
  const data = getProfitHistory(30);
  const max = Math.max(...data.map((d) => Math.abs(d.profit)));
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
          <div className="tnum font-display text-xl font-semibold text-gold-gradient">SAR {fmtSAR(total)}</div>
          <div className="tnum h-4 text-xs text-muted-foreground">
            {h ? `${new Date(h.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · SAR ${fmtSAR(h.profit)}` : "Monthly total"}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {data.map((d, i) => {
          const intensity = 0.15 + (Math.abs(d.profit) / max) * 0.85;
          return (
            <motion.button
              key={d.date}
              aria-label={`${d.date}: SAR ${d.profit}`}
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
  const data = getProfitHistory(ranges[range]).map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) }));
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
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip
              cursor={{ stroke: "var(--gold)", strokeOpacity: 0.3 }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="glass rounded-[14px] px-3 py-2 text-xs shadow-glow">
                    <div className="text-muted-foreground">{payload[0].payload.label}</div>
                    <div className="tnum font-display text-sm font-semibold text-gold">SAR {fmtSAR(payload[0].value as number)}</div>
                  </div>
                ) : null
              }
            />
            <Area key={range} type="monotone" dataKey="profit" stroke="var(--gold)" strokeWidth={2.25} fill="url(#pf)" filter="url(#glow)" animationDuration={1200} activeDot={{ r: 5, fill: "var(--gold)", stroke: "var(--background)", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AccountsHealth() {
  return (
    <div>
      <h3 className="mb-4 font-display text-base font-semibold">Accounts Health</h3>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {platformHealth.map((p) => (
          <div key={p.platform} className="rounded-[18px] border bg-background/40 p-3">
            <div className="text-sm font-medium">{p.platform}</div>
            <div className="tnum mt-2 flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-success" />{p.active}</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-warning" />{p.restricted}</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-danger" />{p.banned}</span>
            </div>
          </div>
        ))}
      </div>
      {expiring.filter((e) => e.daysLeft < 7).map((e) => (
        <div key={e.id} className="mt-2 flex items-center gap-3 rounded-[14px] border border-warning/30 bg-warning/5 px-3 py-2.5 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <span className="flex-1 truncate">{e.label}</span>
          <span className="tnum text-xs text-warning">{e.daysLeft}d left</span>
        </div>
      ))}
    </div>
  );
}
