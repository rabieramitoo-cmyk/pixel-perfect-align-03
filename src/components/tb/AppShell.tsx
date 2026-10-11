import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Command, FileText, LogOut, Moon, MoreHorizontal, Search, Settings, Sun, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { ENTITIES, ENTITY_TYPES } from "@/lib/entities";
import { useLookup, useRecords } from "./records";
import { SettingsDialog } from "./SettingsDialog";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { allNav, moreNav, primaryNav } from "./nav-config";
import { Backdrop, Skeleton } from "./primitives";

function LocalClock() {
  const [t, setT] = useState<string>("");
  useEffect(() => {
    const f = () => setT(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Casablanca", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
    f(); const i = setInterval(f, 1000); return () => clearInterval(i);
  }, []);
  return (
    <div className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs xl:flex">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      <span className="tnum font-medium">{t || "--:--:--"}</span>
      <span className="text-muted-foreground">CAS</span>
    </div>
  );
}

function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label="Toggle theme" className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border hover:bg-accent">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? "d" : "l"} initial={{ y: 16, rotate: -90, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: -16, rotate: 90, opacity: 0 }} transition={{ duration: 0.3 }}>
          {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-gold" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

type PaletteItem = { key: string; label: string; sub: string; icon: LucideIcon; run: () => void };

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const records = useRecords();
  const L = useLookup();
  useEffect(() => { if (open) { setQ(""); setIdx(0); } }, [open]);
  const items = useMemo<PaletteItem[]>(() => {
    const needle = q.trim().toLowerCase();
    const pages: PaletteItem[] = allNav.filter((i) => i.label.toLowerCase().includes(needle)).map((i) => ({ key: i.to, label: i.label, sub: "Page", icon: i.icon, run: () => navigate({ to: i.to }) }));
    if (!needle) return pages;
    const recs: PaletteItem[] = [];
    for (const t of ENTITY_TYPES) {
      if (ENTITIES[t].hidden) continue;
      for (const r of L.rows(t)) {
        const title = L.title(t, r.id);
        if (title.toLowerCase().includes(needle)) recs.push({ key: t + r.id, label: title, sub: ENTITIES[t].singular, icon: FileText, run: () => records.open(t, r.id) });
        if (recs.length > 40) break;
      }
    }
    return [...pages, ...recs].slice(0, 40);
  }, [q, L, navigate, records]);
  const go = (it: PaletteItem) => { onClose(); it.run(); };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-start justify-center bg-background/60 px-4 pt-[18vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div initial={{ y: 12, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 8, scale: 0.98 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-[24px] border bg-popover shadow-card">
            <div className="flex items-center gap-3 border-b px-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus value={q} onChange={(e) => { setQ(e.target.value); setIdx(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
                  if (e.key === "Enter" && items[idx]) go(items[idx]);
                  if (e.key === "Escape") onClose();
                }}
                placeholder="Search brands, accounts, campaigns, BMs…" className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded-md border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
            </div>
            <ul className="max-h-96 overflow-auto p-2">
              {items.map((it, i) => (
                <li key={it.key}>
                  <button onMouseEnter={() => setIdx(i)} onClick={() => go(it)} className={cn("flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm", i === idx && "bg-accent text-gold")}>
                    <it.icon className="h-4 w-4 shrink-0" /> <span className="flex-1 truncate">{it.label}</span>
                    <span className="text-[11px] text-muted-foreground">{it.sub}</span>
                  </button>
                </li>
              ))}
              {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</li>}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const NAV_SPRING = { type: "spring", stiffness: 400, damping: 32 } as const;

/** Close a popover on outside click or Escape. */
function useDismiss(open: boolean, ref: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) close(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open, ref, close]);
}

// The desktop and mobile bars are both in the DOM, so each needs its own layoutId. If they share one,
// framer-motion hands the shared highlight to the hidden mobile bar and the desktop active pill loses its background.
function NavPill({ item, active, layoutId }: { item: (typeof allNav)[number]; active: boolean; layoutId: string }) {
  return (
    <Link to={item.to} aria-label={item.label} aria-current={active ? "page" : undefined} className={cn("relative flex h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-colors md:h-9", active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
      {active && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-gold-gradient shadow-glow" transition={NAV_SPRING} />}
      <item.icon className="relative h-4 w-4" />
      <span className={cn("relative", active ? "inline" : "hidden lg:inline")}>{item.label}</span>
    </Link>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { session, loading } = useAuth();
  const { pathname } = useLocation();
  const [cmd, setCmd] = useState(false);
  const [more, setMore] = useState(false);
  const [moreM, setMoreM] = useState(false);
  const [settings, setSettings] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreMRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmd((o) => !o); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);
  useEffect(() => { setMore(false); setMoreM(false); }, [pathname]);
  useDismiss(more, moreRef, () => setMore(false));
  useDismiss(moreM, moreMRef, () => setMoreM(false));
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !session) navigate({ to: "/login", replace: true }); }, [loading, session, navigate]);

  if (loading || !session) return <div className="min-h-screen bg-background p-8"><Skeleton className="mx-auto mt-24 h-64 max-w-5xl" /></div>;

  const activeMore = moreNav.find((m) => m.to === pathname);
  const moreActive = !!activeMore;
  // When the current page lives under "More", the button shows that page's name and icon instead of "More".
  const MoreIcon = activeMore?.icon ?? MoreHorizontal;

  return (
    <div className="relative min-h-screen bg-background">
      <Backdrop />
      <header className="sticky top-0 z-50 px-4 pt-4">
        {/* Three-column grid (title | nav | actions) so the nav can never collide with the buttons on the right. */}
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
          <div className="min-w-0">
            <div className="smallcaps text-[11px] text-muted-foreground">The Billionaire</div>
            <div className="smallcaps truncate font-display text-sm font-semibold">{title}</div>
          </div>
          {/* Desktop pill nav */}
          <nav className="glass hidden items-center gap-1 rounded-full p-1 md:flex">
            {primaryNav.map((n) => <NavPill key={n.to} item={n} active={pathname === n.to} layoutId="nav-active-desktop" />)}
            <div ref={moreRef} className="relative">
              <button onClick={() => setMore((m) => !m)} aria-expanded={more} aria-haspopup="menu" aria-label={activeMore?.label ?? "More"} className={cn("relative flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors", moreActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {moreActive && <motion.span layoutId="nav-active-desktop" className="absolute inset-0 rounded-full bg-gold-gradient shadow-glow" transition={NAV_SPRING} />}
                <MoreIcon className="relative h-4 w-4" />
                <span className={cn("relative", moreActive ? "inline" : "hidden lg:inline")}>{activeMore?.label ?? "More"}</span>
                <ChevronDown className={cn("relative h-3 w-3 transition-transform", more && "rotate-180")} />
              </button>
              <AnimatePresence>
                {more && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-12 w-44 rounded-[18px] border bg-popover p-1.5 shadow-card">
                    {moreNav.map((m) => (
                      <Link key={m.to} to={m.to} className={cn("flex items-center gap-2.5 rounded-[12px] px-3 py-2 text-sm hover:bg-accent", pathname === m.to && "text-gold")}>
                        <m.icon className="h-4 w-4" /> {m.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
          <div className="flex items-center justify-end gap-2">
            <LocalClock />
            <button onClick={() => setCmd(true)} aria-label="Command palette" className="hidden h-10 items-center gap-1.5 rounded-full border px-3 text-xs text-muted-foreground hover:bg-accent sm:flex">
              <Command className="h-3.5 w-3.5" /> K
            </button>
            <ThemeToggle />
            <button aria-label="Settings" onClick={() => setSettings(true)} className="grid h-10 w-10 place-items-center rounded-full border hover:bg-accent"><Settings className="h-4 w-4" /></button>
            <button aria-label="Sign out" onClick={() => supabase.auth.signOut()} className="grid h-10 w-10 place-items-center rounded-full border hover:bg-accent"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.main key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="relative z-10 mx-auto max-w-7xl px-4 pb-32 pt-8 md:pb-16">
          {children}
        </motion.main>
      </AnimatePresence>

      {/* Mobile bottom bar */}
      <nav className="glass fixed inset-x-4 bottom-4 z-50 flex items-center justify-around rounded-full p-1.5 shadow-card md:hidden">
        {primaryNav.map((n) => <NavPill key={n.to} item={n} active={pathname === n.to} layoutId="nav-active-mobile" />)}
        <div ref={moreMRef} className="relative">
          <button onClick={() => setMoreM((m) => !m)} aria-expanded={moreM} aria-haspopup="menu" aria-label={activeMore?.label ?? "More"} className={cn("relative flex h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-colors", moreActive ? "text-primary-foreground" : "text-muted-foreground")}>
            {moreActive && <motion.span layoutId="nav-active-mobile" className="absolute inset-0 rounded-full bg-gold-gradient shadow-glow" transition={NAV_SPRING} />}
            <MoreIcon className="relative h-4 w-4" />
            {activeMore && <span className="relative">{activeMore.label}</span>}
          </button>
          <AnimatePresence>
            {moreM && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute bottom-full right-0 mb-3 w-52 rounded-[18px] border bg-popover p-1.5 shadow-card">
                {moreNav.map((m) => (
                  <Link key={m.to} to={m.to} className={cn("flex items-center gap-2.5 rounded-[12px] px-3 py-3 text-sm hover:bg-accent", pathname === m.to && "text-gold")}>
                    <m.icon className="h-4 w-4" /> {m.label}
                  </Link>
                ))}
                <button onClick={() => { setMoreM(false); setCmd(true); }} className="flex w-full items-center gap-2.5 rounded-[12px] px-3 py-3 text-left text-sm text-muted-foreground hover:bg-accent">
                  <Search className="h-4 w-4" /> Search
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <CommandPalette open={cmd} onClose={() => setCmd(false)} />
      <SettingsDialog open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}
