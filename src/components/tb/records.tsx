import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Archive, ArrowLeft, Check, Clock, Flag, Plus, Repeat, Trash2, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useDb, useTable, type Row } from "@/lib/db";
import { useCurrency } from "@/lib/currency";
import { ENTITIES, brandDot, referencesTo, statusTone, titleOf, type EntityType, type Field } from "@/lib/entities";
import { rates, totalsOf, useMetrics } from "@/lib/metrics";
import { cn } from "@/lib/utils";

/* ---------------- lookup across all entities ---------------- */
export function useLookup() {
  const tables: Record<string, Row[]> = {
    brands: useTable("brands"), people: useTable("people"), business_managers: useTable("business_managers"),
    profile_bm_roles: useTable("profile_bm_roles"), bm_partners: useTable("bm_partners"), pages: useTable("pages"),
    datasets: useTable("datasets"), domains: useTable("domains"), ad_accounts: useTable("ad_accounts"),
    creatives: useTable("creatives"), campaigns: useTable("campaigns"), campaign_creatives: useTable("campaign_creatives"),
    orders_daily: useTable("orders_daily"), expenses: useTable("expenses"), tasks: useTable("tasks"),
  };
  const deps = Object.values(tables);
  return useMemo(() => {
    const maps = new Map<string, Map<string, Row>>();
    for (const [k, rows] of Object.entries(tables)) maps.set(k, new Map(rows.map((r) => [r.id, r])));
    const get = (t: EntityType, id: string | null | undefined) => (id ? maps.get(t)?.get(id) : undefined);
    const rows = (t: EntityType) => tables[t] ?? [];
    const title = (t: EntityType, id: string | null | undefined) => titleOf(t, get(t, id), get);
    return { get, rows, title };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ---------------- sheet context ---------------- */
type Frame = { type: EntityType; id: string | null; defaults?: Record<string, unknown> };
type Ctx = { open: (type: EntityType, id: string) => void; openNew: (type: EntityType, defaults?: Record<string, unknown>) => void };
const RecordCtx = createContext<Ctx>({ open: () => {}, openNew: () => {} });
export const useRecords = () => useContext(RecordCtx);

export function RecordProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Frame[]>([]);
  const open = useCallback((type: EntityType, id: string) => setStack((s) => [...s, { type, id }]), []);
  const openNew = useCallback((type: EntityType, defaults?: Record<string, unknown>) => setStack((s) => [...s, { type, id: null, defaults }]), []);
  const top = stack[stack.length - 1];
  return (
    <RecordCtx.Provider value={{ open, openNew }}>
      {children}
      <AnimatePresence>
        {top && (
          <>
            <motion.div key="bd" className="fixed inset-0 z-[90] bg-background/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setStack([])} />
            <motion.aside
              key="sheet" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-[95] flex w-full max-w-lg flex-col border-l bg-popover shadow-card"
            >
              <RecordSheet
                key={`${top.type}:${top.id ?? "new"}:${stack.length}`}
                frame={top}
                canBack={stack.length > 1}
                onBack={() => setStack((s) => s.slice(0, -1))}
                onClose={() => setStack([])}
                onCreated={(id) => setStack((s) => [...s.slice(0, -1), { type: top.type, id }])}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </RecordCtx.Provider>
  );
}

/* ---------------- chips & badges ---------------- */
export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  return <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", statusTone[status] ?? "text-muted-foreground")}>{status}</span>;
}

export function FlagBadge({ reason }: { reason?: string | null }) {
  if (!reason) return null;
  return <span title={reason} className="inline-flex items-center gap-1 rounded-full border border-danger/30 px-2 py-0.5 text-[10px] font-medium text-danger"><Flag className="h-3 w-3" />{reason}</span>;
}

export function EntityChip({ type, id, className }: { type: EntityType; id: string | null | undefined; className?: string }) {
  const { open } = useRecords();
  const L = useLookup();
  const r = L.get(type, id);
  if (!id || !r) return null;
  const dot = type === "brands" ? brandDot[r.color] : type === "ad_accounts" ? (r.status === "active" ? "bg-success" : r.status === "restricted" ? "bg-warning" : "bg-danger") : null;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); open(type, id); }}
      className={cn("inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border bg-background/40 px-2.5 py-0.5 text-xs hover:border-gold hover:text-gold", r.archived && "opacity-50", className)}
    >
      {dot && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />}
      <span className="truncate">{L.title(type, id)}</span>
    </button>
  );
}

/* ---------------- relation select with inline create ---------------- */
export function RelationSelect({ target, value, onChange, placeholder = "None", className }: { target: EntityType; value: string | null | undefined; onChange: (id: string | null) => void; placeholder?: string; className?: string }) {
  const L = useLookup();
  const db = useDb();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const cfg = ENTITIES[target];
  const options = L.rows(target).filter((r) => !r.archived || r.id === value);

  const create = async () => {
    if (!name.trim()) return;
    const [row] = await db.insert(cfg.table, { [cfg.nameKey]: name.trim().slice(0, 120) });
    if (row) onChange(row.id);
    setName(""); setCreating(false);
  };

  if (creating) {
    return (
      <div className={cn("flex h-11 items-center gap-1 rounded-[14px] border border-gold bg-background/40 pl-3 pr-1", className)}>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); create(); } if (e.key === "Escape") setCreating(false); }} placeholder={`New ${cfg.singular.toLowerCase()} name`} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        <button type="button" onClick={create} aria-label="Create" className="grid h-8 w-8 place-items-center rounded-[10px] bg-gold-gradient text-primary-foreground"><Check className="h-4 w-4" /></button>
        <button type="button" onClick={() => setCreating(false)} aria-label="Cancel" className="grid h-8 w-8 place-items-center rounded-[10px] hover:bg-accent"><X className="h-4 w-4" /></button>
      </div>
    );
  }
  return (
    <select
      value={value ?? ""}
      onChange={(e) => (e.target.value === "__new" ? setCreating(true) : onChange(e.target.value || null))}
      className={cn("h-11 w-full rounded-[14px] border bg-card px-3 text-sm", className)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.id} value={o.id}>{L.title(target, o.id)}</option>)}
      <option value="__new">+ Create new {cfg.singular.toLowerCase()}</option>
    </select>
  );
}

/* ---------------- dependents ---------------- */
export function useDependents(type: EntityType, id: string | null) {
  const L = useLookup();
  return useMemo(() => {
    if (!id) return [];
    const groups: { type: EntityType; key: string; rows: Row[] }[] = [];
    for (const ref of referencesTo(type)) {
      const rows = L.rows(ref.type).filter((r) => r[ref.key] === id);
      if (rows.length) groups.push({ ...ref, rows });
    }
    return groups;
  }, [L, type, id]);
}

/* ---------------- the sheet ---------------- */
const inputCls = "h-11 w-full rounded-[14px] border bg-background/40 px-3 text-sm outline-none focus:border-gold";

function FieldInput({ f, draft, set }: { f: Field; draft: Row; set: (k: string, v: unknown) => void }) {
  const { fromUSD, toUSD, symbol } = useCurrency();
  const v = draft[f.key];
  if (f.type === "relation") return <RelationSelect target={f.target} value={v} onChange={(id) => set(f.key, id)} />;
  if (f.type === "select") return (
    <select value={v ?? ""} onChange={(e) => set(f.key, e.target.value)} className={inputCls + " bg-card"}>
      {f.options.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
    </select>
  );
  if (f.type === "money") return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{symbol.trim()}</span>
      <input type="number" step="0.01" value={v == null ? "" : +fromUSD(Number(v)).toFixed(2)} onChange={(e) => set(f.key, e.target.value === "" ? 0 : toUSD(Number(e.target.value)))} className={inputCls + " tnum pl-12"} />
    </div>
  );
  return (
    <input
      type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
      value={v ?? ""} maxLength={f.type === "text" ? 200 : undefined}
      onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value || (f.type === "date" ? null : ""))}
      className={inputCls + (f.type === "number" ? " tnum" : "")}
    />
  );
}

function RecordSheet({ frame, canBack, onBack, onClose, onCreated }: { frame: Frame; canBack: boolean; onBack: () => void; onClose: () => void; onCreated: (id: string) => void }) {
  const cfg = ENTITIES[frame.type];
  const L = useLookup();
  const db = useDb();
  const existing = L.get(frame.type, frame.id);
  const [draft, setDraft] = useState<Row>(() => existing ? { ...existing } : { id: "", ...defaultsFor(cfg.fields), ...frame.defaults });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k: string, v: unknown) => { setDraft((d) => ({ ...d, [k]: v })); setDirty(true); };

  const save = async () => {
    setSaving(true); setErr(null);
    const values: Record<string, unknown> = {};
    for (const f of cfg.fields) values[f.key] = draft[f.key] ?? null;
    try {
      if (frame.id) { await db.update(cfg.table, frame.id, values); setDirty(false); }
      else { const [row] = await db.insert(cfg.table, values); if (row) onCreated(row.id); }
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not save"); }
    setSaving(false);
  };

  if (frame.id && !existing) return <div className="p-6 text-sm text-muted-foreground">This record no longer exists. <button onClick={onClose} className="text-gold">Close</button></div>;

  return (
    <>
      <div className="flex items-center gap-2 border-b px-5 py-4">
        {canBack && <button onClick={onBack} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full border hover:bg-accent"><ArrowLeft className="h-4 w-4" /></button>}
        <div className="min-w-0 flex-1">
          <div className="smallcaps text-[11px] text-muted-foreground">{cfg.singular}{existing?.archived ? " · archived" : ""}</div>
          <div className="truncate font-display text-lg font-semibold">{frame.id ? L.title(frame.type, frame.id) : `New ${cfg.singular.toLowerCase()}`}</div>
        </div>
        <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border hover:bg-accent"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <div className="space-y-3">
          {cfg.fields.filter((f) => f.type !== "relation" || !f.showIf || f.showIf(draft)).map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block text-xs text-muted-foreground">{f.label}</span>
              <FieldInput f={f} draft={draft} set={set} />
            </label>
          ))}
          {err && <p className="text-sm text-danger">{err}</p>}
          {(dirty || !frame.id) && (
            <button onClick={save} disabled={saving} className="h-11 w-full rounded-[14px] bg-gold-gradient text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
              {saving ? "Saving…" : frame.id ? "Save changes" : `Create ${cfg.singular.toLowerCase()}`}
            </button>
          )}
        </div>

        {frame.id && existing && (
          <>
            <Related type={frame.type} row={existing} />
            <ActivityList entityId={frame.id} />
            {confirmDelete ? (
              <DeletePanel type={frame.type} row={existing} onCancel={() => setConfirmDelete(false)} onDone={onClose} />
            ) : (
              <div className="flex gap-2 border-t pt-4">
                {existing.archived ? (
                  <button onClick={() => db.update(cfg.table, existing.id, { archived: false })} className="inline-flex h-10 items-center gap-2 rounded-[14px] border px-4 text-sm hover:bg-accent"><Archive className="h-4 w-4" /> Restore</button>
                ) : null}
                <button onClick={() => setConfirmDelete(true)} className="inline-flex h-10 items-center gap-2 rounded-[14px] border px-4 text-sm text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /> Delete…</button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function defaultsFor(fields: Field[]) {
  const d: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "select") d[f.key] = f.options[0];
    if (f.type === "number" || f.type === "money") d[f.key] = 0;
    if (f.type === "date" && (f.key === "day" || f.key === "task_date")) d[f.key] = new Date().toISOString().slice(0, 10);
  }
  return d;
}

/* ---------------- related section ---------------- */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="smallcaps mb-2 text-[11px] text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[14px] border bg-background/40 p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn("tnum font-display text-base font-semibold", tone)}>{value}</div>
    </div>
  );
}

function Related({ type, row }: { type: EntityType; row: Row }) {
  const cfg = ENTITIES[type];
  const deps = useDependents(type, row.id);
  const M = useMetrics();
  const { fmt } = useCurrency();
  const L = useLookup();
  const db = useDb();
  const parents = cfg.fields.filter((f): f is Extract<Field, { type: "relation" }> => f.type === "relation" && !!row[f.key]);
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  const stats = (() => {
    if (type === "brands") {
      const t = totalsOf(M.perBrand, row.id); const r = rates(t);
      return [["Revenue 30D", fmt(t.revenue)], ["Ad spend", fmt(t.spend)], ["Net profit", fmt(t.profit), t.profit >= 0 ? "text-gold" : "text-danger"], ["Confirmation", pct(r.confirmation)], ["Delivery", pct(r.delivery)], ["Returns", pct(r.returns)]] as const;
    }
    if (type === "ad_accounts") {
      const t = totalsOf(M.perAccount, row.id);
      return [["Spend 30D", fmt(t.spend)], ["Revenue", fmt(t.revenue)], ["Profit", fmt(t.profit), t.profit >= 0 ? "text-gold" : "text-danger"]] as const;
    }
    if (type === "campaigns") {
      const t = totalsOf(M.perCampaign, row.id);
      return [["Spend 30D", fmt(t.spend)], ["Revenue", fmt(t.revenue)], ["ROAS", t.spend ? (t.revenue / t.spend).toFixed(2) + "×" : "—", "text-gold"]] as const;
    }
    return null;
  })();

  const flag = type === "campaigns" ? M.flaggedCampaigns.get(row.id) : type === "creatives" ? M.flaggedCreatives.get(row.id) : null;
  const partners = type === "business_managers" ? L.rows("bm_partners").filter((p) => p.bm_a === row.id || p.bm_b === row.id) : [];
  const linkedCreatives = type === "campaigns" ? L.rows("campaign_creatives").filter((l) => l.campaign_id === row.id) : [];
  const linkedCampaigns = type === "creatives" ? L.rows("campaign_creatives").filter((l) => l.creative_id === row.id) : [];

  return (
    <div className="space-y-5 border-t pt-5">
      {flag && <div className="flex items-center gap-2 rounded-[14px] border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger"><Flag className="h-4 w-4" /> Flagged: {flag}</div>}
      {stats && <div className="grid grid-cols-3 gap-2">{stats.map(([l, v, t]) => <Stat key={l} label={l} value={v} tone={t} />)}</div>}

      {parents.length > 0 && (
        <Section title="Linked to">
          <div className="flex flex-wrap gap-1.5">{parents.map((f) => <EntityChip key={f.key} type={f.target} id={row[f.key]} />)}</div>
        </Section>
      )}

      {type === "campaigns" && (
        <Section title="Creatives">
          <div className="flex flex-wrap items-center gap-1.5">
            {linkedCreatives.map((l) => (
              <span key={l.id} className="inline-flex items-center gap-0.5">
                <EntityChip type="creatives" id={l.creative_id} />
                <button aria-label="Unlink" onClick={() => db.remove("campaign_creatives", l.id)} className="text-muted-foreground hover:text-danger"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <RelationSelect target="creatives" value={null} placeholder="Link a creative…" className="mt-2 h-10"
            onChange={(id) => id && !linkedCreatives.some((l) => l.creative_id === id) && db.insert("campaign_creatives", { campaign_id: row.id, creative_id: id })} />
        </Section>
      )}
      {linkedCampaigns.length > 0 && (
        <Section title="Used in campaigns">
          <div className="flex flex-wrap gap-1.5">{linkedCampaigns.map((l) => <EntityChip key={l.id} type="campaigns" id={l.campaign_id} />)}</div>
        </Section>
      )}
      {type === "business_managers" && (
        <Section title="Partners">
          <div className="flex flex-wrap gap-1.5">
            {partners.map((p) => <EntityChip key={p.id} type="business_managers" id={p.bm_a === row.id ? p.bm_b : p.bm_a} />)}
            {partners.length === 0 && <span className="text-xs text-muted-foreground">No partners</span>}
          </div>
          <RelationSelect target="business_managers" value={null} placeholder="Add partner BM…" className="mt-2 h-10"
            onChange={(id) => id && id !== row.id && db.insert("bm_partners", { bm_a: row.id, bm_b: id })} />
        </Section>
      )}
      {type === "business_managers" && <AddRole bmId={row.id} />}

      {deps.filter((g) => g.type !== "campaign_creatives" && g.type !== "bm_partners" && g.type !== "campaign_daily").map((g) => (
        <Section key={g.type + g.key} title={`${ENTITIES[g.type].plural} · ${g.rows.length}`}>
          <div className="flex flex-wrap gap-1.5">
            {g.rows.slice(0, 24).map((r) => <EntityChip key={r.id} type={g.type} id={r.id} />)}
            {g.rows.length > 24 && <span className="text-xs text-muted-foreground">+{g.rows.length - 24} more</span>}
          </div>
        </Section>
      ))}
    </div>
  );
}

function AddRole({ bmId }: { bmId: string }) {
  const db = useDb();
  const [person, setPerson] = useState<string | null>(null);
  const [role, setRole] = useState("employee");
  return (
    <Section title="Add profile to this BM">
      <div className="flex gap-2">
        <RelationSelect target="people" value={person} onChange={setPerson} placeholder="Choose profile…" className="h-10" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-[14px] border bg-card px-2 text-sm"><option>admin</option><option>employee</option></select>
        <button disabled={!person} onClick={async () => { await db.insert("profile_bm_roles", { person_id: person, bm_id: bmId, role }); setPerson(null); }} aria-label="Add" className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border hover:bg-accent disabled:opacity-40"><Plus className="h-4 w-4" /></button>
      </div>
    </Section>
  );
}

/* ---------------- activity ---------------- */
const tableLabel = (t: string) => (ENTITIES as Record<string, { singular: string }>)[t]?.singular ?? t;

export function activitySentence(a: Row) {
  const verb = a.action === "insert" ? "created" : a.action === "delete" ? "deleted" : "updated";
  const ch = a.changes ? Object.keys(a.changes).filter((k) => !["updated_at"].includes(k)) : [];
  const detail = a.action === "update" && ch.length
    ? ch.slice(0, 3).map((k) => (k === "status" || k === "done" || k === "archived" ? `${k} → ${String(a.changes[k])}` : k.replace(/_id$/, "").replace("_", " "))).join(", ")
    : "";
  return { who: "You", verb, what: `${tableLabel(a.entity_type)} ${a.label ? `“${a.label}”` : ""}`, detail };
}

export const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

function ActivityList({ entityId }: { entityId: string }) {
  const log = useTable("activity_log").filter((a) => a.entity_id === entityId).slice(0, 12);
  return (
    <Section title="Activity">
      {log.length === 0 ? <p className="text-xs text-muted-foreground">No changes recorded yet.</p> : (
        <ul className="space-y-2">
          {log.map((a) => { const s = activitySentence(a); return (
            <li key={a.id} className="flex items-start gap-2 text-xs">
              <Clock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="flex-1"><span className="font-medium">{s.who}</span> {s.verb}{s.detail ? ` · ${s.detail}` : ""}</span>
              <span className="tnum shrink-0 text-muted-foreground">{timeAgo(a.created_at)}</span>
            </li>
          ); })}
        </ul>
      )}
    </Section>
  );
}

/* ---------------- delete with dependents ---------------- */
function DeletePanel({ type, row, onCancel, onDone }: { type: EntityType; row: Row; onCancel: () => void; onDone: () => void }) {
  const cfg = ENTITIES[type];
  const deps = useDependents(type, row.id);
  const db = useDb();
  const [target, setTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const total = deps.reduce((a, g) => a + g.rows.length, 0);
  const allTables = deps.map((g) => ENTITIES[g.type].table);

  const run = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); onDone(); } finally { setBusy(false); } };

  return (
    <div className="space-y-3 rounded-[18px] border border-danger/30 bg-danger/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-danger"><AlertTriangle className="h-4 w-4" /> Delete {cfg.singular.toLowerCase()} “{titleOf(type, row)}”?</div>
      {total > 0 ? (
        <>
          <p className="text-xs text-muted-foreground">{total} linked record{total > 1 ? "s" : ""} will be affected:</p>
          <ul className="space-y-1 text-xs">
            {deps.map((g) => <li key={g.type + g.key} className="flex justify-between"><span>{ENTITIES[g.type].plural}</span><span className="tnum">{g.rows.length}</span></li>)}
          </ul>
          <div className="flex gap-2 pt-1">
            <RelationSelect target={type} value={target} onChange={setTarget} placeholder="Reassign to…" className="h-10" />
            <button disabled={!target || target === row.id || busy} onClick={() => run(async () => {
              for (const g of deps) await db.updateWhere(ENTITIES[g.type].table, g.key, row.id, { [g.key]: target });
              await db.remove(cfg.table, row.id, allTables);
            })} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[14px] border px-3 text-sm hover:bg-accent disabled:opacity-40"><Repeat className="h-4 w-4" /> Reassign</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => run(() => db.update(cfg.table, row.id, { archived: true }))} className="inline-flex h-10 items-center gap-1.5 rounded-[14px] bg-gold-gradient px-4 text-sm font-semibold text-primary-foreground"><Archive className="h-4 w-4" /> Archive instead</button>
            <button disabled={busy} onClick={() => run(() => db.remove(cfg.table, row.id, allTables))} className="h-10 rounded-[14px] border border-danger/40 px-4 text-sm text-danger hover:bg-danger/10">Delete anyway</button>
            <button onClick={onCancel} className="h-10 rounded-[14px] px-3 text-sm text-muted-foreground">Cancel</button>
          </div>
        </>
      ) : (
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => run(() => db.remove(cfg.table, row.id))} className="h-10 rounded-[14px] border border-danger/40 px-4 text-sm text-danger hover:bg-danger/10">Delete</button>
          <button onClick={onCancel} className="h-10 rounded-[14px] px-3 text-sm text-muted-foreground">Cancel</button>
        </div>
      )}
    </div>
  );
}
