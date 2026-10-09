import { AnimatePresence, Reorder, motion } from "framer-motion";
import { Check, Copy, Flame, GripVertical, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { riyadhDate, useDb, useTable, useTableLoading, type Row } from "@/lib/db";
import { brandDot } from "@/lib/entities";
import { cn } from "@/lib/utils";
import { EntityChip, RelationSelect, useLookup, useRecords } from "./records";
import { Skeleton } from "./primitives";

export { riyadhDate };

const prioClass: Record<string, string> = {
  high: "text-danger border-danger/30",
  medium: "text-warning border-warning/30",
  low: "text-muted-foreground",
};

export function useTasksFor(date: string) {
  const all = useTable("tasks");
  return useMemo(() => all.filter((t) => t.task_date === date && !t.archived).sort((a, b) => a.position - b.position), [all, date]);
}
export const useTodayTasks = () => useTasksFor(riyadhDate());

function Confetti() {
  const bits = Array.from({ length: 28 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((_, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-gold-gradient"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos((i / bits.length) * Math.PI * 2) * (120 + (i % 4) * 40), y: Math.sin((i / bits.length) * Math.PI * 2) * (80 + (i % 3) * 30), opacity: 0, scale: 0.4 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export function TaskList({ date = riyadhDate() }: { date?: string }) {
  const db = useDb();
  const L = useLookup();
  const { open } = useRecords();
  const loading = useTableLoading("tasks");
  const list = useTasksFor(date);
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const [prio, setPrio] = useState("medium");
  const [celebrate, setCelebrate] = useState(false);

  const toggle = async (t: Row) => {
    const done = !t.done;
    const next = list.map((x) => (x.id === t.id ? { ...x, done } : x));
    if (done && next.length && next.every((x) => x.done)) { setCelebrate(true); setTimeout(() => setCelebrate(false), 1400); }
    await db.update("tasks", t.id, { done, streak: done ? t.streak + 1 : Math.max(0, t.streak - 1) });
  };

  const addRows = async (rows: Record<string, unknown>[]) => {
    const base = list.length;
    await db.insert("tasks", rows.map((r, i) => ({ ...r, task_date: date, position: base + i })));
  };

  const reorder = (next: Row[]) => {
    const pos = new Map(next.map((t, i) => [t.id, i]));
    db.setLocal("tasks", (rows) => rows.map((r) => (pos.has(r.id) ? { ...r, position: pos.get(r.id) } : r)));
  };
  const persistOrder = async () => {
    await Promise.all(list.map((t, i) => supabase.from("tasks").update({ position: i }).eq("id", t.id)));
  };

  const copyYesterday = async () => {
    const { data } = await supabase.from("tasks").select("title,brand_id,ad_account_id,campaign_id,priority,streak,done,auto_key").eq("task_date", riyadhDate(-1)).order("position");
    const rows = (data ?? []).filter((r) => !r.auto_key).map((r) => ({ title: r.title, brand_id: r.brand_id, ad_account_id: r.ad_account_id, campaign_id: r.campaign_id, priority: r.priority, streak: r.done ? r.streak : 0 }));
    if (rows.length) await addRows(rows);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addRows([{ title: title.trim().slice(0, 200), brand_id: brand, priority: prio }]);
    setTitle("");
  };

  if (loading) return <div className="grid gap-2 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;

  return (
    <div className="relative">
      {celebrate && <Confetti />}
      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-[18px] border border-dashed py-10 text-center">
          <p className="font-display text-lg">A clean slate.</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first task or bring yesterday's list forward.</p>
          <button onClick={copyYesterday} className="mt-4 inline-flex h-10 items-center gap-2 rounded-[14px] border px-4 text-sm hover:bg-accent">
            <Copy className="h-4 w-4" /> Copy yesterday's list
          </button>
        </div>
      ) : (
        <Reorder.Group axis="y" values={list} onReorder={reorder} className="grid gap-2 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {list.map((t) => {
              const b = L.get("brands", t.brand_id);
              return (
                <Reorder.Item
                  key={t.id} value={t} onDragEnd={persistOrder}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                  className="group flex min-h-14 cursor-grab items-center gap-3 rounded-[18px] border bg-background/40 px-3 py-2 active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  <button
                    onClick={() => toggle(t)} aria-label={t.done ? "Mark not done" : "Mark done"}
                    className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors", t.done ? "border-transparent bg-gold-gradient shadow-glow" : "border-input hover:border-gold")}
                  >
                    <AnimatePresence>
                      {t.done && (
                        <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                          <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", b ? brandDot[b.color] : "bg-muted-foreground/40")} title={b?.name} />
                  <div className="min-w-0 flex-1">
                    <button onClick={() => open("tasks", t.id)} className="relative block max-w-full truncate text-left text-sm">
                      <span className={cn("transition-colors", t.done && "text-muted-foreground")}>{t.title}</span>
                      <motion.span className="absolute left-0 top-1/2 h-px bg-muted-foreground" initial={false} animate={{ width: t.done ? "100%" : "0%" }} transition={{ duration: 0.35 }} />
                    </button>
                    {(t.ad_account_id || t.campaign_id || t.auto_key) && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {t.auto_key && <span className="inline-flex items-center gap-1 text-[10px] text-gold"><Sparkles className="h-3 w-3" />Auto</span>}
                        <EntityChip type="ad_accounts" id={t.ad_account_id} className="py-0 text-[10px]" />
                        <EntityChip type="campaigns" id={t.campaign_id} className="py-0 text-[10px]" />
                      </div>
                    )}
                  </div>
                  <span className={cn("hidden rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider sm:inline", prioClass[t.priority])}>{t.priority}</span>
                  {t.streak > 0 && <span className="tnum flex items-center gap-0.5 text-xs text-gold"><Flame className="h-3 w-3" />{t.streak}</span>}
                  <button onClick={() => db.remove("tasks", t.id)} aria-label="Delete task" className="opacity-0 transition-opacity group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" /></button>
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      )}

      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-[14px] border bg-background/40 px-3 focus-within:border-gold">
          <Plus className="h-4 w-4 text-gold" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Add task" className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <RelationSelect target="brands" value={brand} onChange={setBrand} placeholder="No brand" className="sm:w-44" />
        <select value={prio} onChange={(e) => setPrio(e.target.value)} className="h-11 rounded-[14px] border bg-card px-3 text-sm">
          <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
        {list.length > 0 && (
          <button type="button" onClick={copyYesterday} aria-label="Copy yesterday's list" className="grid h-11 w-11 place-items-center rounded-[14px] border hover:bg-accent"><Copy className="h-4 w-4" /></button>
        )}
      </form>
    </div>
  );
}
