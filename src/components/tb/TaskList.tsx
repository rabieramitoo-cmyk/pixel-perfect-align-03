import { AnimatePresence, Reorder, motion } from "framer-motion";
import { Check, Copy, Flame, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { brands, defaultTasks } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { Skeleton } from "./primitives";

export type Task = {
  id: string; title: string; brand: string; brand_color: string; priority: string;
  done: boolean; position: number; task_date: string; streak: number;
};

export const riyadhDate = (offsetDays = 0) => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(d);
};

const brandColor = (b: string) => brands.find((x) => x.name === b)?.color ?? "brand-4";
const dotClass: Record<string, string> = { "brand-1": "bg-brand-1", "brand-2": "bg-brand-2", "brand-3": "bg-brand-3", "brand-4": "bg-brand-4" };
const prioClass: Record<string, string> = {
  high: "text-danger border-danger/30",
  medium: "text-warning border-warning/30",
  low: "text-muted-foreground",
};

export const tasksKey = (date: string) => ["tasks", date];

export function useTodayTasks() {
  const date = riyadhDate();
  return useQuery({
    queryKey: tasksKey(date),
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").eq("task_date", date).order("position");
      if (error) throw error;
      return data as Task[];
    },
  });
}

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

export function TaskList() {
  const qc = useQueryClient();
  const date = riyadhDate();
  const { data: tasks, isLoading } = useTodayTasks();
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState(brands[0].name);
  const [prio, setPrio] = useState("medium");
  const [celebrate, setCelebrate] = useState(false);

  const setLocal = (fn: (t: Task[]) => Task[]) => qc.setQueryData<Task[]>(tasksKey(date), (old) => fn(old ?? []));

  const toggle = useMutation({
    mutationFn: async (t: Task) => {
      const { error } = await supabase.from("tasks").update({ done: !t.done, streak: !t.done ? t.streak + 1 : Math.max(0, t.streak - 1) }).eq("id", t.id);
      if (error) throw error;
    },
    onMutate: (t) => {
      const next = (tasks ?? []).map((x) => (x.id === t.id ? { ...x, done: !x.done, streak: !x.done ? x.streak + 1 : Math.max(0, x.streak - 1) } : x));
      setLocal(() => next);
      if (next.length && next.every((x) => x.done)) { setCelebrate(true); setTimeout(() => setCelebrate(false), 1400); }
    },
    onError: () => qc.invalidateQueries({ queryKey: tasksKey(date) }),
  });

  const add = useMutation({
    mutationFn: async (rows: { title: string; brand: string; priority: string; streak?: number }[]) => {
      const base = tasks?.length ?? 0;
      const { error } = await supabase.from("tasks").insert(
        rows.map((r, i) => ({ ...r, brand_color: brandColor(r.brand), task_date: date, position: base + i })),
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(date) }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("tasks").delete().eq("id", id); if (error) throw error; },
    onMutate: (id) => setLocal((t) => t.filter((x) => x.id !== id)),
  });

  const reorder = async (next: Task[]) => {
    setLocal(() => next.map((t, i) => ({ ...t, position: i })));
  };
  const persistOrder = async () => {
    const cur = qc.getQueryData<Task[]>(tasksKey(date)) ?? [];
    await Promise.all(cur.map((t, i) => supabase.from("tasks").update({ position: i }).eq("id", t.id)));
  };

  const copyYesterday = async () => {
    const { data } = await supabase.from("tasks").select("title,brand,priority,streak,done").eq("task_date", riyadhDate(-1)).order("position");
    const rows = data && data.length ? data.map((r) => ({ title: r.title, brand: r.brand, priority: r.priority, streak: r.done ? r.streak : 0 })) : defaultTasks;
    add.mutate(rows);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    add.mutate([{ title: title.trim().slice(0, 200), brand, priority: prio }]);
    setTitle("");
  };

  if (isLoading) return <div className="grid gap-2 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;

  const list = tasks ?? [];

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
            {list.map((t) => (
              <Reorder.Item
                key={t.id} value={t} onDragEnd={persistOrder}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                className="group flex min-h-14 cursor-grab items-center gap-3 rounded-[18px] border bg-background/40 px-3 py-2 active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                <button
                  onClick={() => toggle.mutate(t)} aria-label={t.done ? "Mark not done" : "Mark done"}
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
                <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClass[t.brand_color] ?? "bg-gold")} title={t.brand} />
                <span className="relative min-w-0 flex-1 truncate text-sm">
                  <span className={cn("transition-colors", t.done && "text-muted-foreground")}>{t.title}</span>
                  <motion.span className="absolute left-0 top-1/2 h-px bg-muted-foreground" initial={false} animate={{ width: t.done ? "100%" : "0%" }} transition={{ duration: 0.35 }} />
                </span>
                <span className={cn("hidden rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider sm:inline", prioClass[t.priority])}>{t.priority}</span>
                {t.streak > 0 && <span className="tnum flex items-center gap-0.5 text-xs text-gold"><Flame className="h-3 w-3" />{t.streak}</span>}
                <button onClick={() => remove.mutate(t.id)} aria-label="Delete task" className="opacity-0 transition-opacity group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" /></button>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-[14px] border bg-background/40 px-3 focus-within:border-gold">
          <Plus className="h-4 w-4 text-gold" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Add task" className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="h-11 rounded-[14px] border bg-card px-3 text-sm">
          {brands.map((b) => <option key={b.name}>{b.name}</option>)}
        </select>
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
