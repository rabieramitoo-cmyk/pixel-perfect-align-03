import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Row } from "@/lib/db";
import { ENTITIES, type EntityType } from "@/lib/entities";
import { cn } from "@/lib/utils";
import { useRecords } from "./records";
import { Skeleton } from "./primitives";

export type Column = { label: string; cell: (r: Row) => ReactNode; className?: string };

/** Generic record list used by every section page. Click a row to open its sheet. */
export function EntityList({ type, rows, columns, title, loading, empty, defaults }: { type: EntityType; rows: Row[]; columns: Column[]; title?: string; loading?: boolean; empty?: string; defaults?: Record<string, unknown> }) {
  const cfg = ENTITIES[type];
  const { open, openNew } = useRecords();
  const [showArchived, setShowArchived] = useState(false);
  const visible = rows.filter((r) => showArchived || !r.archived);
  const archivedCount = rows.length - rows.filter((r) => !r.archived).length;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-base font-semibold">{title ?? cfg.plural} <span className="tnum text-sm font-normal text-muted-foreground">{visible.length}</span></h3>
        <div className="flex items-center gap-2">
          {archivedCount > 0 && (
            <button onClick={() => setShowArchived((s) => !s)} className="h-9 rounded-full border px-3 text-xs text-muted-foreground hover:bg-accent">{showArchived ? "Hide" : "Show"} archived ({archivedCount})</button>
          )}
          <button onClick={() => openNew(type, defaults)} className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium hover:border-gold hover:text-gold">
            <Plus className="h-3.5 w-3.5" /> New {cfg.singular.toLowerCase()}
          </button>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-[18px] border border-dashed py-10 text-center">
          <p className="font-display text-lg">{empty ?? `No ${cfg.plural.toLowerCase()} yet`}</p>
          <button onClick={() => openNew(type, defaults)} className="mt-3 inline-flex h-10 items-center gap-2 rounded-[14px] border px-4 text-sm hover:bg-accent"><Plus className="h-4 w-4" /> Add the first one</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                {columns.map((c) => <th key={c.label} className={cn("px-3 pb-1 font-medium", c.className)}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <motion.tr
                  key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.02 }}
                  onClick={() => open(type, r.id)}
                  className={cn("cursor-pointer bg-background/40 transition-colors hover:bg-accent/60", r.archived && "opacity-50")}
                >
                  {columns.map((c, ci) => (
                    <td key={c.label} className={cn("border-y px-3 py-2.5", ci === 0 && "rounded-l-[14px] border-l", ci === columns.length - 1 && "rounded-r-[14px] border-r", c.className)}>{c.cell(r)}</td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[] }) {
  return (
    <div className="relative mb-4 inline-flex flex-wrap rounded-full border p-0.5">
      {items.map((it) => (
        <button key={it.value} onClick={() => onChange(it.value)} className={cn("relative h-9 rounded-full px-4 text-xs font-medium", value === it.value ? "text-primary-foreground" : "text-muted-foreground")}>
          {value === it.value && <motion.span layoutId="page-tabs" className="absolute inset-0 rounded-full bg-gold-gradient" />}
          <span className="relative">{it.label}</span>
        </button>
      ))}
    </div>
  );
}
