import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

/** Card with cursor-follow gold spotlight and gentle 3D tilt. */
export function GlowCard({ children, className, tilt = true, delay = 0 }: { children: ReactNode; className?: string; tilt?: boolean; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rx = useSpring(0, { stiffness: 200, damping: 20 });
  const ry = useSpring(0, { stiffness: 200, damping: 20 });
  const [pos, setPos] = useState({ x: 50, y: 50, on: false });

  const onMove = (e: MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    setPos({ x: px * 100, y: py * 100, on: true });
    if (tilt && !reduce) { rx.set((0.5 - py) * 4); ry.set((px - 0.5) * 4); }
  };
  const onLeave = () => { setPos((p) => ({ ...p, on: false })); rx.set(0); ry.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={cn("relative overflow-hidden rounded-[24px] border bg-card p-5 shadow-card", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: pos.on ? 1 : 0,
          background: `radial-gradient(420px circle at ${pos.x}% ${pos.y}%, var(--gold-soft), transparent 45%)`,
        }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export function CountUp({ value, decimals = 0, prefix = "", suffix = "", className }: { value: number; decimals?: number; prefix?: string; suffix?: string; className?: string }) {
  const mv = useMotionValue(0);
  const reduce = useReducedMotion();
  const text = useTransform(mv, (v) =>
    prefix + new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v) + suffix,
  );
  useEffect(() => {
    if (reduce) { mv.set(value); return; }
    const c = animate(mv, value, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [value, reduce, mv]);
  return <motion.span className={cn("tnum", className)}>{text}</motion.span>;
}

export function ProgressRing({ value, size = 200, stroke = 14, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--gold-from)" />
            <stop offset="100%" stopColor="var(--gold-to)" />
          </linearGradient>
          <filter id="ring-glow"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--muted)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke="url(#ring-gold)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} filter="url(#ring-glow)" opacity={0.5}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke="url(#ring-gold)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function Sparkline({ data, positive = true }: { data: number[]; positive?: boolean }) {
  const w = 96, h = 32;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / (max - min || 1)) * (h - 4) - 2]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <motion.path
        d={d} fill="none" stroke={positive ? "var(--gold)" : "var(--danger)"} strokeWidth={1.75} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
}

/** Primary button with magnetic pull and press feedback. */
export function MagneticButton({ children, className, onClick, type = "button", disabled }: { children: ReactNode; className?: string; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useSpring(0, { stiffness: 250, damping: 15 });
  const y = useSpring(0, { stiffness: 250, damping: 15 });
  const reduce = useReducedMotion();
  return (
    <motion.button
      ref={ref} type={type} disabled={disabled} onClick={onClick}
      style={{ x, y }}
      whileTap={{ scale: 0.96 }}
      onMouseMove={(e) => {
        if (reduce || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.25);
        y.set((e.clientY - r.top - r.height / 2) * 0.25);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-gold-gradient px-5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity disabled:opacity-50",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", className)}>{children}</span>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-[14px]", className)} />;
}

export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {right}
    </div>
  );
}

export function Backdrop() {
  return (<><div className="aurora" aria-hidden /><div className="grain" aria-hidden /></>);
}
