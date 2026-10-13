import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { addDays, useRange, type RangeKey } from "@/lib/range";
import { useDismiss } from "@/lib/use-dismiss";
import { cn } from "@/lib/utils";

const MAIN: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All time" },
];
const MORE: { key: RangeKey; label: string }[] = [
  { key: "14d", label: "Last 14 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "lastMonth", label: "Last month" },
  { key: "year", label: "This year" },
  { key: "custom", label: "Custom range…" },
];

/** Global date range control. The choice is shared by every page and remembered between visits. */
export function RangeSwitcher({ className }: { className?: string }) {
  const { state, bounds, today, setRange } = useRange();
  const pillId = useId();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const moreRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useDismiss(open, moreRef, () => { setOpen(false); setCustom(false); });

  const moreActive = MORE.some((m) => m.key === state.key);

  // Keep the active pill visible when the row scrolls (small screens).
  useEffect(() => {
    scrollRef.current?.querySelector<HTMLElement>("[aria-pressed=true]")?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [state.key]);

  const openCustom = () => {
    setFrom(bounds.from ?? addDays(today, -29));
    setTo(bounds.to);
    setCustom(true);
  };
  const pick = (key: RangeKey) => {
    if (key === "custom") { openCustom(); return; }
    setRange({ key });
    setOpen(false);
  };
  const valid = !!from && !!to && from <= to && to <= today;
  const apply = () => {
    if (!valid) return;
    setRange({ key: "custom", from, to });
    setOpen(false); setCustom(false);
  };

  return (
    <div role="group" aria-label="Date range" className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
      <div className="inline-flex max-w-full items-center rounded-full border p-0.5">
        <div ref={scrollRef} className="flex min-w-0 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MAIN.map((r) => {
            const active = state.key === r.key;
            return (
              <button key={r.key} onClick={() => setRange({ key: r.key })} aria-pressed={active} className={cn("relative h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors", active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {active && <motion.span layoutId={pillId} className="absolute inset-0 rounded-full bg-gold-gradient shadow-glow" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <span className="relative">{r.label}</span>
              </button>
            );
          })}
        </div>
        <div ref={moreRef} className="relative shrink-0">
          <button onClick={() => { setOpen((o) => !o); setCustom(false); }} aria-haspopup="menu" aria-expanded={open} aria-pressed={moreActive} className={cn("relative flex h-8 items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors", moreActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {moreActive && <motion.span layoutId={pillId} className="absolute inset-0 rounded-full bg-gold-gradient shadow-glow" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            <span className="relative max-w-[10rem] truncate">{moreActive ? bounds.short : "More"}</span>
            <ChevronDown className={cn("relative h-3 w-3 transition-transform", open && "rotate-180")} />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-10 z-40 w-64 rounded-[18px] border bg-popover p-1.5 shadow-card">
                {!custom ? (
                  MORE.map((m) => (
                    <button key={m.key} onClick={() => pick(m.key)} className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left text-sm hover:bg-accent", state.key === m.key && "text-gold")}>
                      {m.key === "custom" ? <CalendarDays className="h-4 w-4" /> : <span className="h-4 w-4" />}
                      <span className="flex-1">{m.label}</span>
                      {state.key === m.key && <Check className="h-4 w-4" />}
                    </button>
                  ))
                ) : (
                  <div className="space-y-3 p-2">
                    <div className="text-xs font-medium text-muted-foreground">Custom range</div>
                    <label className="block text-xs text-muted-foreground">From
                      <input type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-10 w-full rounded-[12px] border bg-background px-3 text-sm text-foreground dark:[color-scheme:dark]" />
                    </label>
                    <label className="block text-xs text-muted-foreground">To
                      <input type="date" value={to} min={from || undefined} max={today} onChange={(e) => setTo(e.target.value)} className="mt-1 h-10 w-full rounded-[12px] border bg-background px-3 text-sm text-foreground dark:[color-scheme:dark]" />
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => setCustom(false)} className="h-10 flex-1 rounded-[12px] border text-sm text-muted-foreground hover:bg-accent">Back</button>
                      <button onClick={apply} disabled={!valid} className="h-10 flex-1 rounded-[12px] bg-gold-gradient text-sm font-semibold text-primary-foreground disabled:opacity-40">Apply</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <span className="tnum text-xs text-muted-foreground">{bounds.dates}</span>
    </div>
  );
}
