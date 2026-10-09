import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/tb/AppShell";
import { EntityList } from "@/components/tb/EntityList";
import { PageHeader, StatCard, pct } from "@/components/tb/PageHeader";
import { GlowCard } from "@/components/tb/primitives";
import { OrderFunnel, ProfitChart } from "@/components/tb/charts";
import { EntityChip } from "@/components/tb/records";
import { useTable, useTableLoading } from "@/lib/db";
import { useCurrency } from "@/lib/currency";
import { platformLabel } from "@/lib/entities";
import { rates, useMetrics } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/money")({
  head: () => ({
    meta: [
      { title: "Money — The Billionaire" },
      { name: "description", content: "Net profit by day, brand and platform, plus every expense." },
      { property: "og:title", content: "Money — The Billionaire" },
      { property: "og:description", content: "Net profit by day, brand and platform, plus every expense." },
    ],
  }),
  component: MoneyPage,
});

function MoneyPage() {
  const M = useMetrics();
  const { fmt } = useCurrency();
  const expenses = useTable("expenses");
  const loading = useTableLoading("expenses");
  const brands = useTable("brands").filter((b) => !b.archived);
  const w = M.windowTotals;
  const r = rates(w);
  const recent = [...expenses].sort((a, b) => (a.day < b.day ? 1 : -1)).filter((e) => !["product_cost", "shipping"].includes(e.category) || e.day >= M.today);
  return (
    <AppShell title="Money">
      <PageHeader title="Money" blurb="Net profit = revenue − ad spend − product cost − shipping − expenses. Last 30 days." />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Revenue" value={fmt(w.revenue)} />
        <StatCard label="Ad spend" value={fmt(w.spend)} delay={0.04} />
        <StatCard label="Expenses" value={fmt(w.expenses)} delay={0.08} />
        <StatCard label="Net profit" value={fmt(w.profit)} tone={w.profit >= 0 ? "text-gold" : "text-danger"} delay={0.12} />
        <StatCard label="Delivery rate" value={pct(r.delivery)} sub={`Confirm ${pct(r.confirmation)} · Returns ${pct(r.returns)}`} delay={0.16} />
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_380px]">
        <GlowCard tilt={false}><ProfitChart /></GlowCard>
        <GlowCard><OrderFunnel /></GlowCard>
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <GlowCard tilt={false}>
          <h3 className="mb-4 font-display text-base font-semibold">Profit by brand</h3>
          <Breakdown rows={brands.map((b) => ({ key: b.id, label: <EntityChip type="brands" id={b.id} />, t: M.perBrand.get(b.id) }))} fmt={fmt} />
        </GlowCard>
        <GlowCard tilt={false}>
          <h3 className="mb-4 font-display text-base font-semibold">Profit by platform <span className="text-xs font-normal text-muted-foreground">· attributed</span></h3>
          <Breakdown rows={[...M.perPlatform.entries()].map(([p, t]) => ({ key: p, label: <span className="text-sm">{platformLabel[p] ?? p}</span>, t }))} fmt={fmt} />
        </GlowCard>
      </div>
      <GlowCard tilt={false}>
        <EntityList type="expenses" rows={recent} loading={loading} title="Expenses" columns={[
          { label: "Description", cell: (e) => <span className="font-medium">{e.name}</span> },
          { label: "Category", cell: (e) => <span className="text-xs text-muted-foreground">{e.category.replace("_", " ")}</span> },
          { label: "Day", cell: (e) => <span className="tnum text-xs">{e.day}</span> },
          { label: "Linked", cell: (e) => <div className="flex flex-wrap gap-1"><EntityChip type="brands" id={e.brand_id} /><EntityChip type="ad_accounts" id={e.ad_account_id} /><EntityChip type="campaigns" id={e.campaign_id} /></div> },
          { label: "Amount", className: "text-right", cell: (e) => <span className="tnum">{fmt(Number(e.amount))}</span> },
        ]} />
      </GlowCard>
    </AppShell>
  );
}

function Breakdown({ rows, fmt }: { rows: { key: string; label: React.ReactNode; t?: { revenue: number; spend: number; expenses: number; profit: number } | undefined }[]; fmt: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.t?.profit ?? 0)));
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const p = r.t?.profit ?? 0;
        return (
          <div key={r.key}>
            <div className="mb-1 flex items-center justify-between gap-2">{r.label}<span className={cn("tnum text-sm font-medium", p >= 0 ? "text-gold" : "text-danger")}>{fmt(p)}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", p >= 0 ? "bg-gold-gradient" : "bg-danger")} style={{ width: `${(Math.abs(p) / max) * 100}%` }} /></div>
            <div className="tnum mt-1 text-[11px] text-muted-foreground">Rev {fmt(r.t?.revenue ?? 0)} · Spend {fmt(r.t?.spend ?? 0)} · Exp {fmt(r.t?.expenses ?? 0)}</div>
          </div>
        );
      })}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
    </div>
  );
}
