import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/tb/AppShell";
import { EntityList } from "@/components/tb/EntityList";
import { PageHeader, StatCard, pct } from "@/components/tb/PageHeader";
import { GlowCard } from "@/components/tb/primitives";
import { EntityChip } from "@/components/tb/records";
import { useTable, useTableLoading } from "@/lib/db";
import { RATES_TO_USD, useCurrency } from "@/lib/currency";
import { rates, useMetrics } from "@/lib/metrics";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — The Billionaire" },
      { name: "description", content: "Daily COD orders per brand with confirmation, delivery and return rates." },
      { property: "og:title", content: "Orders — The Billionaire" },
      { property: "og:description", content: "Daily COD orders per brand with confirmation, delivery and return rates." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const rows = useTable("orders_daily");
  const loading = useTableLoading("orders_daily");
  const M = useMetrics();
  const { fmt } = useCurrency();
  const r = rates(M.windowTotals);
  const sorted = [...rows].sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 120);
  return (
    <AppShell title="Orders">
      <PageHeader title="Orders" blurb="One row per brand per day. Rates feed Today, Money and every brand." />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Orders 30D" value={M.windowTotals.orders.toLocaleString("en-US")} />
        <StatCard label="Confirmation" value={pct(r.confirmation)} tone="text-gold" delay={0.05} />
        <StatCard label="Delivery" value={pct(r.delivery)} tone="text-gold" delay={0.1} />
        <StatCard label="Returns" value={pct(r.returns)} tone="text-danger" delay={0.15} />
      </div>
      <GlowCard tilt={false}>
        <EntityList type="orders_daily" rows={sorted} loading={loading} title="Daily orders" columns={[
          { label: "Day", cell: (o) => <span className="tnum">{o.day}</span> },
          { label: "Brand", cell: (o) => <EntityChip type="brands" id={o.brand_id} /> },
          { label: "Orders", className: "text-right", cell: (o) => <span className="tnum">{o.orders}</span> },
          { label: "Confirmed", className: "text-right", cell: (o) => <span className="tnum">{o.confirmed}</span> },
          { label: "Delivered", className: "text-right", cell: (o) => <span className="tnum">{o.delivered}</span> },
          { label: "Returned", className: "text-right", cell: (o) => <span className="tnum">{o.returned}</span> },
          { label: "Revenue", className: "text-right", cell: (o) => <span className="tnum">{fmt(Number(o.revenue) * (RATES_TO_USD[o.currency] ?? 1))}</span> },
        ]} />
      </GlowCard>
    </AppShell>
  );
}
