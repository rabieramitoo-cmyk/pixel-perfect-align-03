import { AnimatePresence, motion } from "framer-motion";
import { Database, Trash2, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDb, useTable } from "@/lib/db";
import { CURRENCIES } from "@/lib/currency";
import { cn } from "@/lib/utils";

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useDb();
  const settings = useTable("user_settings")[0];
  const cur = settings?.currency ?? "USD";
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const setCurrency = async (c: string) => {
    db.setLocal("user_settings", (rows) => rows.length ? rows.map((r) => ({ ...r, currency: c })) : [{ id: "local", currency: c }]);
    await supabase.from("user_settings").upsert({ currency: c, updated_at: new Date().toISOString() } as never, { onConflict: "user_id" });
    db.invalidateAll();
  };
  const run = async (key: string, fn: string) => {
    setBusy(key);
    await supabase.rpc(fn as "seed_demo_data");
    await supabase.rpc("sync_auto_tasks");
    db.invalidateAll();
    setBusy(null); setConfirmClear(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-start justify-center bg-background/60 px-4 pt-[14vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div initial={{ y: 12, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 8, scale: 0.98 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-[24px] border bg-popover p-6 shadow-card">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Settings</h2>
              <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>

            <div className="smallcaps mb-2 text-[11px] text-muted-foreground">Currency</div>
            <div className="relative mb-6 inline-flex rounded-full border p-0.5">
              {CURRENCIES.map((c) => (
                <button key={c} onClick={() => setCurrency(c)} className={cn("relative h-9 rounded-full px-5 text-sm font-medium", cur === c ? "text-primary-foreground" : "text-muted-foreground")}>
                  {cur === c && <motion.span layoutId="cur-pill" className="absolute inset-0 rounded-full bg-gold-gradient" />}
                  <span className="relative">{c}</span>
                </button>
              ))}
            </div>

            <div className="smallcaps mb-2 text-[11px] text-muted-foreground">Demo data</div>
            <p className="mb-3 text-sm text-muted-foreground">Sample brands, accounts, campaigns, orders and expenses. Your own records are never touched.</p>
            <div className="flex flex-wrap gap-2">
              <button disabled={!!busy} onClick={() => run("seed", "seed_demo_data")} className="inline-flex h-10 items-center gap-2 rounded-[14px] border px-4 text-sm hover:bg-accent disabled:opacity-50">
                <Database className="h-4 w-4" /> {busy === "seed" ? "Loading…" : "Reload demo data"}
              </button>
              {confirmClear ? (
                <button disabled={!!busy} onClick={() => run("clear", "clear_demo_data")} className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-danger/40 px-4 text-sm text-danger hover:bg-danger/10">
                  <Trash2 className="h-4 w-4" /> {busy === "clear" ? "Clearing…" : "Yes, clear all demo data"}
                </button>
              ) : (
                <button onClick={() => setConfirmClear(true)} className="inline-flex h-10 items-center gap-2 rounded-[14px] border px-4 text-sm text-danger hover:bg-danger/10">
                  <Trash2 className="h-4 w-4" /> Clear demo data
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
