import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/tb/AppShell";
import { EntityList } from "@/components/tb/EntityList";
import { PageHeader } from "@/components/tb/PageHeader";
import { GlowCard } from "@/components/tb/primitives";
import { TaskList } from "@/components/tb/TaskList";
import { EntityChip } from "@/components/tb/records";
import { riyadhDate, useTable, useTableLoading } from "@/lib/db";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — The Billionaire" },
      { name: "description", content: "Today's list and every task linked to brands, accounts and campaigns." },
      { property: "og:title", content: "Tasks — The Billionaire" },
      { property: "og:description", content: "Today's list and every task linked to brands, accounts and campaigns." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const all = useTable("tasks");
  const loading = useTableLoading("tasks");
  const today = riyadhDate();
  const history = [...all].filter((t) => t.task_date !== today).sort((a, b) => (a.task_date < b.task_date ? 1 : -1));
  return (
    <AppShell title="Tasks">
      <PageHeader title="Tasks" blurb="Link tasks to a brand, account or campaign — they show up on those records too." />
      <GlowCard tilt={false} className="mb-4">
        <h3 className="mb-4 font-display text-base font-semibold">Today</h3>
        <TaskList />
      </GlowCard>
      <GlowCard tilt={false}>
        <EntityList type="tasks" rows={history} loading={loading} title="Other days" columns={[
          { label: "Task", cell: (t) => <span className={t.done ? "text-muted-foreground line-through" : "font-medium"}>{t.title}</span> },
          { label: "Date", cell: (t) => <span className="tnum text-xs">{t.task_date}</span> },
          { label: "Priority", cell: (t) => <span className="text-xs uppercase text-muted-foreground">{t.priority}</span> },
          { label: "Linked", cell: (t) => <div className="flex flex-wrap gap-1"><EntityChip type="brands" id={t.brand_id} /><EntityChip type="ad_accounts" id={t.ad_account_id} /><EntityChip type="campaigns" id={t.campaign_id} /></div> },
        ]} />
      </GlowCard>
    </AppShell>
  );
}
