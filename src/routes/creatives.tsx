import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/tb/AppShell";
import { EntityList } from "@/components/tb/EntityList";
import { PageHeader } from "@/components/tb/PageHeader";
import { GlowCard } from "@/components/tb/primitives";
import { EntityChip, FlagBadge, StatusBadge } from "@/components/tb/records";
import { useTable, useTableLoading } from "@/lib/db";
import { useMetrics } from "@/lib/metrics";

export const Route = createFileRoute("/creatives")({
  head: () => ({
    meta: [
      { title: "Creatives — The Billionaire" },
      { name: "description", content: "Ad creatives by brand, with the campaigns that use them." },
      { property: "og:title", content: "Creatives — The Billionaire" },
      { property: "og:description", content: "Ad creatives by brand, with the campaigns that use them." },
    ],
  }),
  component: CreativesPage,
});

function CreativesPage() {
  const rows = useTable("creatives");
  const loading = useTableLoading("creatives");
  const cc = useTable("campaign_creatives");
  const M = useMetrics();
  return (
    <AppShell title="Creatives">
      <PageHeader title="Creatives" blurb="Creatives are flagged automatically when a campaign using them is killed or its account is disabled." />
      <GlowCard tilt={false}>
        <EntityList type="creatives" rows={rows} loading={loading} columns={[
          { label: "Creative", cell: (r) => <span className="font-medium">{r.name}</span> },
          { label: "Format", cell: (r) => <span className="text-xs text-muted-foreground">{r.format}</span> },
          { label: "Status", cell: (r) => <div className="flex flex-wrap gap-1"><StatusBadge status={r.status} /><FlagBadge reason={M.flaggedCreatives.get(r.id)?.split(" · ")[0]} /></div> },
          { label: "Brand", cell: (r) => <EntityChip type="brands" id={r.brand_id} /> },
          { label: "Campaigns", cell: (r) => <div className="flex flex-wrap gap-1">{cc.filter((l) => l.creative_id === r.id).map((l) => <EntityChip key={l.id} type="campaigns" id={l.campaign_id} />)}</div> },
        ]} />
      </GlowCard>
    </AppShell>
  );
}
