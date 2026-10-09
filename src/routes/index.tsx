import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Flame } from "lucide-react";
import { AppShell } from "@/components/tb/AppShell";
import { CountUp, GlowCard, Pill, ProgressRing, Sparkline } from "@/components/tb/primitives";
import { TaskList, useTodayTasks } from "@/components/tb/TaskList";
import { AccountsHealth, ProfitChart, ProfitHeatmap } from "@/components/tb/charts";
import { getKpis, getStreak } from "@/lib/demo-data";
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
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Riyadh", hour: "numeric", hour12: false }).format(new Date()));
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
  const { data: tasks = [] } = useTodayTasks();
  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? done / tasks.length : 0;
  const kpis = getKpis();
  const date = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Riyadh", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div>
          <p className="text-sm text-muted-foreground">{date}</p>
          <h1 className="font-display text-4xl font-semibold md:text-5xl">{greeting()}, <span className="text-gold-gradient">Rabie</span></h1>
        </div>
        <Pill className="text-gold"><Flame className="h-3.5 w-3.5" /><span className="tnum">{getStreak()}</span> profitable days</Pill>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <GlowCard className="flex flex-col items-center justify-center py-8" tilt={false}>
          <ProgressRing value={pct}>
            <CountUp value={Math.round(pct * 100)} suffix="%" className="font-display text-5xl font-semibold" />
            <span className="tnum mt-1 text-sm text-muted-foreground">{done} / {tasks.length} tasks</span>
          </ProgressRing>
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted-foreground">Daily execution</p>
        </GlowCard>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {kpis.map((k, i) => {
            const delta = k.prev ? ((k.value - k.prev) / Math.abs(k.prev)) * 100 : 0;
            const good = k.key === "spend" ? delta <= 0 : delta >= 0;
            return (
              <GlowCard key={k.key} delay={0.05 * i} className="flex flex-col justify-between gap-4">
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className="font-display text-2xl font-semibold md:text-3xl">
                  {k.format === "sar" ? <CountUp value={k.value} prefix="SAR " /> : <CountUp value={k.value} decimals={2} suffix="×" />}
                </div>
                <div className="flex items-end justify-between">
                  <span className={cn("tnum flex items-center text-xs font-medium", good ? "text-success" : "text-danger")}>
                    {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {Math.abs(delta).toFixed(1)}%
                  </span>
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
        <GlowCard delay={0.2}><ProfitHeatmap /></GlowCard>
        <GlowCard tilt={false} delay={0.25}><ProfitChart /></GlowCard>
      </div>

      <GlowCard tilt={false} delay={0.3}><AccountsHealth /></GlowCard>
    </div>
  );
}
