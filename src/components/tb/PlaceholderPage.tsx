import type { LucideIcon } from "lucide-react";
import { AppShell } from "./AppShell";
import { GlowCard, Pill, Skeleton } from "./primitives";

export function PlaceholderPage({ title, icon: Icon, blurb }: { title: string; icon: LucideIcon; blurb: string }) {
  return (
    <AppShell title={title}>
      <div className="mb-8">
        <Pill className="text-gold"><Icon className="h-3.5 w-3.5" /> Coming next</Pill>
        <h1 className="mt-4 font-display text-4xl font-semibold md:text-5xl">{title}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{blurb}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <GlowCard key={i} delay={i * 0.06}>
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="h-8 w-32" />
          </GlowCard>
        ))}
        <GlowCard className="md:col-span-3" delay={0.2}>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full border text-gold shadow-glow"><Icon className="h-6 w-6" /></div>
            <p className="mt-4 font-display text-lg">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">This section will be built in the next step.</p>
          </div>
        </GlowCard>
      </div>
    </AppShell>
  );
}
