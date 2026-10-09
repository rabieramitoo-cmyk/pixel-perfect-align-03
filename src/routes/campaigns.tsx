import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/tb/AppShell";
import { EntityList } from "@/components/tb/EntityList";
import { PageHeader, StatCard } from "@/components/tb/PageHeader";
import { GlowCard } from "@/components/tb/primitives";
import { EntityChip, FlagBadge, StatusBadge } from "@/components/tb/records";
import { useTable, useTableLoading } from "@/lib/db";
import { useCurrency } from "@/lib/currency";
import { totalsOf, useMetrics } from "@/lib/metrics";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — The Billionaire" },
      { name: "description", content: "Live campaigns with spend, revenue, ROAS and dependency flags." },
      { property: "og:title", content: "Campaigns — The Billionaire" },
      { property: "og:description", content: "Live campaigns with spend, revenue, ROAS and dependency flags." },
    ],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const rows = useTable("campaigns");
  const loading = useTableLoading("campaigns");
  const cc = useTable("campaign_creatives");
  const M = useMetrics();
  const { fmt } = useCurrency();
  const live = rows.filter((r) => !r.archived);
  const spend = live.reduce((a, r) => a + totalsOf(M.perCampaign, r.id).spend, 0);
  const rev = live.reduce((a, r) => a + totalsOf(M.perCampaign, r.id).revenue, 0);
  return (
    <AppShell title="Campaigns">
      <PageHeader title="Campaigns" blurb="Spend and revenue here feed Money, Today and every brand and account total." />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active campaigns" value={live.filter((r) => r.status === "active").length} />
        <StatCard label="Spend 30D" value={fmt(spend)} delay={0.05} />
        <StatCard label="Attributed revenue 30D" value={fmt(rev)} delay={0.1} />
        <StatCard label="Flagged" value={M.flaggedCampaigns.size} tone={M.flaggedCampaigns.size ? "text-danger" : undefined} delay={0.15} />
      </div>
      <GlowCard tilt={false}>
        <EntityList type="campaigns" rows={rows} loading={loading} columns={[
          { label: "Campaign", cell: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.product}</div></div> },
          { label: "Status", cell: (r) => <div className="flex flex-wrap gap-1"><StatusBadge status={r.status} /><FlagBadge reason={r.status === "killed" ? null : M.flaggedCampaigns.get(r.id)} /></div> },
          { label: "Brand", cell: (r) => <EntityChip type="brands" id={r.brand_id} /> },
          { label: "Account", cell: (r) => <EntityChip type="ad_accounts" id={r.ad_account_id} /> },
          { label: "Creatives", cell: (r) => <span className="tnum">{cc.filter((l) => l.campaign_id === r.id).length}</span> },
          { label: "Spend 30D", className: "text-right", cell: (r) => <span className="tnum">{fmt(totalsOf(M.perCampaign, r.id).spend)}</span> },
          { label: "ROAS", className: "text-right", cell: (r) => { const t = totalsOf(M.perCampaign, r.id); return <span className="tnum text-gold">{t.spend ? (t.revenue / t.spend).toFixed(2) + "×" : "—"}</span>; } },
        ]} />
      </GlowCard>
    </AppShell>
  );
}
