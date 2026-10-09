import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/tb/AppShell";
import { EntityList, Tabs } from "@/components/tb/EntityList";
import { PageHeader } from "@/components/tb/PageHeader";
import { GlowCard } from "@/components/tb/primitives";
import { EntityChip, StatusBadge, useLookup, useRecords } from "@/components/tb/records";
import { useTable, useTableLoading } from "@/lib/db";
import { useCurrency } from "@/lib/currency";
import { platformLabel } from "@/lib/entities";
import { totalsOf, useMetrics } from "@/lib/metrics";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — The Billionaire" },
      { name: "description", content: "Ad accounts, business managers, profiles, pixels and domains." },
      { property: "og:title", content: "Accounts — The Billionaire" },
      { property: "og:description", content: "Ad accounts, business managers, profiles, pixels and domains." },
    ],
  }),
  component: AccountsPage,
});

type Tab = "accounts" | "structure" | "people" | "assets";

function AccountsPage() {
  const [tab, setTab] = useState<Tab>("accounts");
  return (
    <AppShell title="Accounts">
      <PageHeader title="Accounts" blurb="Every ad account and the Facebook structure behind it." />
      <Tabs value={tab} onChange={setTab} items={[{ value: "accounts", label: "Ad accounts" }, { value: "structure", label: "Facebook structure" }, { value: "people", label: "Profiles" }, { value: "assets", label: "Pages · Pixels · Domains" }]} />
      {tab === "accounts" && <AdAccounts />}
      {tab === "structure" && <Structure />}
      {tab === "people" && <People />}
      {tab === "assets" && <Assets />}
    </AppShell>
  );
}

function AdAccounts() {
  const rows = useTable("ad_accounts");
  const loading = useTableLoading("ad_accounts");
  const M = useMetrics();
  const { fmt } = useCurrency();
  const campaigns = useTable("campaigns");
  return (
    <GlowCard tilt={false}>
      <EntityList type="ad_accounts" rows={rows} loading={loading} columns={[
        { label: "Account", cell: (r) => <span className="font-medium">{r.name}</span> },
        { label: "Platform", cell: (r) => platformLabel[r.platform] ?? r.platform },
        { label: "Status", cell: (r) => <StatusBadge status={r.status} /> },
        { label: "Brand", cell: (r) => <EntityChip type="brands" id={r.brand_id} /> },
        { label: "BM", cell: (r) => <EntityChip type="business_managers" id={r.bm_id} /> },
        { label: "Campaigns", cell: (r) => <span className="tnum">{campaigns.filter((c) => c.ad_account_id === r.id).length}</span> },
        { label: "Spend 30D", className: "text-right", cell: (r) => <span className="tnum">{fmt(totalsOf(M.perAccount, r.id).spend)}</span> },
        { label: "Spanda", cell: (r) => <span className="tnum text-xs text-muted-foreground">{r.spanda_expires_at ?? "—"}</span> },
      ]} />
    </GlowCard>
  );
}

function Structure() {
  const L = useLookup();
  const { open, openNew } = useRecords();
  const bms = L.rows("business_managers").filter((b) => !b.archived);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {bms.map((bm, i) => {
        const roles = L.rows("profile_bm_roles").filter((r) => r.bm_id === bm.id);
        const accs = L.rows("ad_accounts").filter((a) => a.bm_id === bm.id);
        const ds = L.rows("datasets").filter((d) => d.bm_id === bm.id);
        const dom = L.rows("domains").filter((d) => d.bm_id === bm.id);
        const pg = L.rows("pages").filter((d) => d.bm_id === bm.id);
        const partners = L.rows("bm_partners").filter((p) => p.bm_a === bm.id || p.bm_b === bm.id);
        const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
          <div className="flex items-start gap-3 py-2"><span className="smallcaps w-24 shrink-0 pt-0.5 text-[11px] text-muted-foreground">{label}</span><div className="flex flex-1 flex-wrap gap-1.5">{children}</div></div>
        );
        return (
          <GlowCard key={bm.id} delay={i * 0.05} tilt={false}>
            <button onClick={() => open("business_managers", bm.id)} className="mb-3 flex w-full items-center justify-between text-left">
              <span className="font-display text-lg font-semibold hover:text-gold">{bm.name}</span>
              <StatusBadge status={bm.status} />
            </button>
            <div className="divide-y">
              <Row label="Profiles">{roles.map((r) => <span key={r.id} className="inline-flex items-center gap-1"><EntityChip type="people" id={r.person_id} /><span className="text-[10px] uppercase text-muted-foreground">{r.role}</span></span>)}</Row>
              <Row label="Ad accounts">{accs.map((a) => <EntityChip key={a.id} type="ad_accounts" id={a.id} />)}</Row>
              <Row label="Datasets">{ds.map((d) => <EntityChip key={d.id} type="datasets" id={d.id} />)}</Row>
              <Row label="Pages">{pg.map((d) => <EntityChip key={d.id} type="pages" id={d.id} />)}</Row>
              <Row label="Domains">{dom.map((d) => <EntityChip key={d.id} type="domains" id={d.id} />)}</Row>
              <Row label="Partners">{partners.map((p) => <EntityChip key={p.id} type="business_managers" id={p.bm_a === bm.id ? p.bm_b : p.bm_a} />)}</Row>
            </div>
          </GlowCard>
        );
      })}
      <button onClick={() => openNew("business_managers")} className="flex min-h-40 items-center justify-center rounded-[24px] border border-dashed text-sm text-muted-foreground hover:border-gold hover:text-gold">+ New business manager</button>
    </div>
  );
}

function People() {
  const rows = useTable("people");
  const roles = useTable("profile_bm_roles");
  return (
    <GlowCard tilt={false}>
      <EntityList type="people" rows={rows} columns={[
        { label: "Name", cell: (r) => <span className="font-medium">{r.display_name}</span> },
        { label: "Business Managers", cell: (r) => <div className="flex flex-wrap gap-1">{roles.filter((x) => x.person_id === r.id).map((x) => <span key={x.id} className="inline-flex items-center gap-1"><EntityChip type="business_managers" id={x.bm_id} /><span className="text-[10px] uppercase text-muted-foreground">{x.role}</span></span>)}</div> },
      ]} />
    </GlowCard>
  );
}

function Assets() {
  const pages = useTable("pages"), datasets = useTable("datasets"), domains = useTable("domains");
  const accounts = useTable("ad_accounts");
  return (
    <div className="space-y-4">
      <GlowCard tilt={false}><EntityList type="datasets" rows={datasets} title="Pixels / datasets" columns={[
        { label: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
        { label: "BM", cell: (r) => <EntityChip type="business_managers" id={r.bm_id} /> },
        { label: "Used by", cell: (r) => <div className="flex flex-wrap gap-1">{accounts.filter((a) => a.dataset_id === r.id).map((a) => <EntityChip key={a.id} type="ad_accounts" id={a.id} />)}</div> },
      ]} /></GlowCard>
      <GlowCard tilt={false}><EntityList type="pages" rows={pages} columns={[
        { label: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
        { label: "Brand", cell: (r) => <EntityChip type="brands" id={r.brand_id} /> },
        { label: "BM", cell: (r) => <EntityChip type="business_managers" id={r.bm_id} /> },
      ]} /></GlowCard>
      <GlowCard tilt={false}><EntityList type="domains" rows={domains} columns={[
        { label: "Domain", cell: (r) => <span className="font-medium">{r.name}</span> },
        { label: "Brand", cell: (r) => <EntityChip type="brands" id={r.brand_id} /> },
        { label: "BM", cell: (r) => <EntityChip type="business_managers" id={r.bm_id} /> },
      ]} /></GlowCard>
    </div>
  );
}
