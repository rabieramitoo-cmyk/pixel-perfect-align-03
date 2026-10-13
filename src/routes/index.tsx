import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Flame } from "lucide-react";
import { AppShell } from "@/components/tb/AppShell";
import { CountUp, GlowCard, Pill, ProgressRing, Sparkline } from "@/components/tb/primitives";
import { TaskList, useTodayTasks } from "@/components/tb/TaskList";
import { AccountsHealth, ActivityFeed, OrderFunnel, ProfitChart, ProfitHeatmap } from "@/components/tb/charts";
import { useMetrics } from "@/lib/metrics";
import { compareLabel } from "@/lib/range";
import { RangeSwitcher } from "@/components/tb/RangeSwitcher";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — The Billionaire" },
      { name: "description", content: "Today's tasks, profit and account health at a glance." },
      { property: "og:title", content: "Today — The Billionaire" },
      { property: "og:description", content: "Today's tasks, profit and account health at a glance." },
    ],
  }),
  component: Today,
});

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Casablanca", hour: "numeric", hour12: false }).format(new Date()));
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Today() {
  return (
    <AppShell title="Today">
      <TodayBody />
    </AppShell>
  );
}

function TodayBody() {
  const tasks = useTodayTasks();
  const M = useMetrics();
  const { fromUSD, symbol } = useCurrency();
  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? done / tasks.length : 0;
  const t = M.windowTotals, y = M.previousTotals;
  const sparkDays = M.series.slice(-30);
  const cmp = compareLabel(M.range.key);
  const roas = (d: { revenue: number; spend: number }) => (d.spend ? d.revenue / d.spend : 0);
  const kpis = [
    { key: "spend", label: `Ad Spend · ${M.range.short}`, value: t.spend, prev: y.spend, money: true, spark: sparkDays.map((d) => d.spend) },
    { key: "revenue", label: `Revenue · ${M.range.short}`, value: t.revenue, prev: y.revenue, money: true, spark: sparkDays.map((d) => d.revenue) },
    { key: "profit", label: `Net Profit · ${M.range.short}`, value: t.profit, prev: y.profit, money: true, spark: sparkDays.map((d) => d.profit) },
    { key: "roas", label: `ROAS · ${M.range.short}`, value: roas(t), prev: roas(y), money: false, spark: sparkDays.map(roas) },
  ];
  const date = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Casablanca", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div>
          <p className="text-sm text-muted-foreground">{date}</p>
          <h1 className="font-display text-4xl font-semibold md:text-5xl">{greeting()}, <span className="text-gold-gradient">Rabie</span></h1>
        </div>
        <Pill className="text-gold"><Flame className="h-3.5 w-3.5" /><span className="tnum">{M.streak}</span> profitable days</Pill>
      </motion.div>
      <RangeSwitcher />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <GlowCard className="py-8" contentClassName="flex h-full flex-col items-center justify-center" tilt={false}>
          <ProgressRing value={pct}>
            <CountUp value={Math.round(pct * 100)} suffix="%" className="font-display text-5xl font-semibold" />
            <span className="tnum mt-1 text-sm text-muted-foreground">{done} / {tasks.length} tasks</span>
          </ProgressRing>
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted-foreground">Daily execution</p>
        </GlowCard>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {kpis.map((k, i) => {
            const delta = k.prev ? ((k.value - k.prev) / Math.abs(k.prev)) * 100 : 0;
            const showDelta = M.range.key !== "all";
            const good = k.key === "spend" ? delta <= 0 : delta >= 0;
            return (
              <GlowCard key={k.key} delay={0.05 * i} contentClassName="flex h-full flex-col justify-between gap-4">
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className="font-display text-2xl font-semibold md:text-3xl">
                  {k.money ? <CountUp value={fromUSD(k.value)} prefix={symbol} /> : <CountUp value={k.value} decimals={2} suffix="×" />}
                </div>
                <div className="flex items-end justify-between">
                  {showDelta ? (
                    <span className={cn("tnum flex flex-col text-xs font-medium", good ? "text-success" : "text-danger")}>
                      <span className="flex items-center">
                        {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {Math.abs(delta).toFixed(1)}%
                      </span>
                      <span className="text-[10px] font-normal text-muted-foreground">{cmp}</span>
                    </span>
                  ) : <span />}
                  <Sparkline data={k.spark} positive={good} />
                </div>
              </GlowCard>
            );
          })}
        </div>
      </div>

      <GlowCard tilt={false} delay={0.15}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">Today's Tasks</h3>
          <span className="text-xs text-muted-foreground">Drag to reorder</span>
        </div>
        <TaskList />
      </GlowCard>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <GlowCard delay={0.2} contentClassName="flex h-full flex-col"><ProfitHeatmap /></GlowCard>
        <GlowCard tilt={false} delay={0.25}><ProfitChart /></GlowCard>
      </div>

      <GlowCard tilt={false} delay={0.3}><AccountsHealth /></GlowCard>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <GlowCard delay={0.35}><OrderFunnel /></GlowCard>
        <GlowCard tilt={false} delay={0.4}><ActivityFeed /></GlowCard>
      </div>
    </div>
  );
}
