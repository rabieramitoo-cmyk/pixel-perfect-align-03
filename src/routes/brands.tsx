import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/tb/AppShell";
import { PageHeader, pct } from "@/components/tb/PageHeader";
import { GlowCard } from "@/components/tb/primitives";
import { useRecords } from "@/components/tb/records";
import { useTable } from "@/lib/db";
import { useCurrency } from "@/lib/currency";
import { brandDot } from "@/lib/entities";
import { rates, totalsOf, useMetrics } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: "Brands — The Billionaire" },
      { name: "description", content: "Each brand with its profit, order rates, accounts and campaigns." },
      { property: "og:title", content: "Brands — The Billionaire" },
      { property: "og:description", content: "Each brand with its profit, order rates, accounts and campaigns." },
    ],
  }),
  component: BrandsPage,
});

function BrandsPage() {
  const brands = useTable("brands").filter((b) => !b.archived);
  const accounts = useTable("ad_accounts"), campaigns = useTable("campaigns"), creatives = useTable("creatives");
  const M = useMetrics();
  const { fmt } = useCurrency();
  const { open, openNew } = useRecords();
  return (
    <AppShell title="Brands">
      <PageHeader title="Brands" blurb="The center of everything. Open a brand to see all its connected records." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {brands.map((b, i) => {
          const t = totalsOf(M.perBrand, b.id); const r = rates(t);
          return (
            <button key={b.id} onClick={() => open("brands", b.id)} className="text-left">
              <GlowCard delay={i * 0.05} className="h-full">
                <div className="mb-4 flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", brandDot[b.color])} />
                  <span className="font-display text-lg font-semibold">{b.name}</span>
                </div>
                <div className={cn("tnum font-display text-3xl font-semibold", t.profit >= 0 ? "text-gold-gradient" : "text-danger")}>{fmt(t.profit)}</div>
                <div className="text-xs text-muted-foreground">Net profit · 30D</div>
                <div className="tnum mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div><div className="text-muted-foreground">Revenue</div>{fmt(t.revenue, true)}</div>
                  <div><div className="text-muted-foreground">Spend</div>{fmt(t.spend, true)}</div>
                  <div><div className="text-muted-foreground">Expenses</div>{fmt(t.expenses, true)}</div>
                  <div><div className="text-muted-foreground">Confirm</div>{pct(r.confirmation)}</div>
                  <div><div className="text-muted-foreground">Delivery</div>{pct(r.delivery)}</div>
                  <div><div className="text-muted-foreground">Returns</div>{pct(r.returns)}</div>
                </div>
                <div className="mt-4 flex gap-3 border-t pt-3 text-xs text-muted-foreground">
                  <span className="tnum">{accounts.filter((a) => a.brand_id === b.id).length} accounts</span>
                  <span className="tnum">{campaigns.filter((a) => a.brand_id === b.id).length} campaigns</span>
                  <span className="tnum">{creatives.filter((a) => a.brand_id === b.id).length} creatives</span>
                </div>
              </GlowCard>
            </button>
          );
        })}
        <button onClick={() => openNew("brands")} className="flex min-h-56 items-center justify-center gap-2 rounded-[24px] border border-dashed text-sm text-muted-foreground hover:border-gold hover:text-gold"><Plus className="h-4 w-4" /> New brand</button>
      </div>
    </AppShell>
  );
}
