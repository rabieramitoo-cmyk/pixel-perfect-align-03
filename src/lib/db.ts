import { useEffect } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = any;

export const TABLES = [
  "brands", "people", "business_managers", "profile_bm_roles", "bm_partners", "pages", "datasets", "domains",
  "ad_accounts", "creatives", "campaigns", "campaign_creatives", "campaign_daily", "orders_daily", "expenses",
  "tasks", "activity_log", "user_settings",
] as const;
export type TableName = (typeof TABLES)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (t: TableName) => supabase.from(t as any) as any;

async function fetchAll(t: TableName): Promise<Row[]> {
  if (t === "activity_log") {
    const { data, error } = await from(t).select("*").order("created_at", { ascending: false }).limit(400);
    if (error) throw error;
    return data;
  }
  const out: Row[] = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await from(t).select("*").range(start, start + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

export const tableKey = (t: TableName) => ["t", t] as const;
const EMPTY: Row[] = [];

/** The single source of truth: every view reads tables through this hook. */
export function useTable(t: TableName): Row[] {
  return useQuery({ queryKey: tableKey(t), queryFn: () => fetchAll(t), staleTime: 60_000 }).data ?? EMPTY;
}
export function useTableLoading(t: TableName) {
  return useQuery({ queryKey: tableKey(t), queryFn: () => fetchAll(t), staleTime: 60_000 }).isLoading;
}

const invalidate = (qc: QueryClient, tables: TableName[]) => {
  tables.forEach((t) => qc.invalidateQueries({ queryKey: tableKey(t) }));
  qc.invalidateQueries({ queryKey: tableKey("activity_log") });
};

export function useDb() {
  const qc = useQueryClient();
  return {
    qc,
    async insert(t: TableName, values: Record<string, unknown> | Record<string, unknown>[]) {
      const { data, error } = await from(t).insert(values).select();
      if (error) throw error;
      invalidate(qc, [t]);
      return data as Row[];
    },
    async update(t: TableName, id: string, values: Record<string, unknown>) {
      qc.setQueryData<Row[]>(tableKey(t), (old) => old?.map((r) => (r.id === id ? { ...r, ...values } : r)));
      const { error } = await from(t).update(values).eq("id", id);
      if (error) { invalidate(qc, [t]); throw error; }
      invalidate(qc, [t]);
    },
    async updateWhere(t: TableName, col: string, val: string, values: Record<string, unknown>) {
      const { error } = await from(t).update(values).eq(col, val);
      if (error) throw error;
      invalidate(qc, [t]);
    },
    async remove(t: TableName, id: string, alsoInvalidate: TableName[] = []) {
      qc.setQueryData<Row[]>(tableKey(t), (old) => old?.filter((r) => r.id !== id));
      const { error } = await from(t).delete().eq("id", id);
      if (error) { invalidate(qc, [t]); throw error; }
      invalidate(qc, [t, ...alsoInvalidate]);
    },
    setLocal(t: TableName, fn: (rows: Row[]) => Row[]) {
      qc.setQueryData<Row[]>(tableKey(t), (old) => fn(old ?? []));
    },
    invalidateAll() { TABLES.forEach((t) => qc.invalidateQueries({ queryKey: tableKey(t) })); },
  };
}

/** One realtime channel for the whole app; any change refreshes every open view. */
export function useRealtimeSync(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const pending = new Set<TableName>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ch = supabase
      .channel("db-all")
      .on("postgres_changes", { event: "*", schema: "public" }, (p) => {
        pending.add(p.table as TableName);
        clearTimeout(timer);
        timer = setTimeout(() => {
          const ts = [...pending];
          pending.clear();
          ts.forEach((t) => qc.invalidateQueries({ queryKey: tableKey(t) }));
          if (ts.includes("ad_accounts")) supabase.rpc("sync_auto_tasks").then(() => qc.invalidateQueries({ queryKey: tableKey("tasks") }));
        }, 200);
      })
      .subscribe();
    return () => { clearTimeout(timer); supabase.removeChannel(ch); };
  }, [enabled, qc]);
}

/** First sign-in: seed demo data once; always refresh auto-generated tasks. */
export function useBootstrap(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    (async () => {
      const { data } = await supabase.from("user_settings").select("demo_seeded").maybeSingle();
      if (!data) {
        await supabase.rpc("seed_demo_data");
        TABLES.forEach((t) => qc.invalidateQueries({ queryKey: tableKey(t) }));
      }
      await supabase.rpc("sync_auto_tasks");
      qc.invalidateQueries({ queryKey: tableKey("tasks") });
    })();
  }, [enabled, qc]);
}

export const riyadhDate = (offsetDays = 0) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date(Date.now() + offsetDays * 86400000));
