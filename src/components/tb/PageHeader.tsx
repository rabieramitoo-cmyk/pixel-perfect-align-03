import type { ReactNode } from "react";
import { GlowCard } from "./primitives";
import { cn } from "@/lib/utils";

export function PageHeader({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-4xl font-semibold md:text-5xl">{title}</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">{blurb}</p>
    </div>
  );
}

export function StatCard({ label, value, tone, sub, delay = 0 }: { label: string; value: ReactNode; tone?: string; sub?: ReactNode; delay?: number }) {
  return (
    <GlowCard delay={delay} className="flex flex-col gap-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("tnum font-display text-2xl font-semibold", tone)}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </GlowCard>
  );
}

export const pct = (v: number) => `${Math.round(v * 100)}%`;
