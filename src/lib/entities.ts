import type { Row, TableName } from "./db";

export type Field =
  | { key: string; label: string; type: "text" | "date" | "number" | "money" }
  | { key: string; label: string; type: "select"; options: string[] }
  | { key: string; label: string; type: "relation"; target: EntityType; showIf?: (r: Row) => boolean };

export type EntityType =
  | "brands" | "people" | "business_managers" | "profile_bm_roles" | "bm_partners" | "pages" | "datasets" | "domains"
  | "ad_accounts" | "creatives" | "campaigns" | "campaign_creatives" | "campaign_daily" | "orders_daily" | "expenses" | "tasks";

export type EntityConfig = {
  table: TableName;
  singular: string;
  plural: string;
  nameKey: string;
  fields: Field[];
  hidden?: boolean; // not directly browsable (join/daily rows)
};

const STATUS_ACC = ["active", "restricted", "disabled"];

export const ENTITIES: Record<EntityType, EntityConfig> = {
  brands: { table: "brands", singular: "Brand", plural: "Brands", nameKey: "name", fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "color", label: "Color", type: "select", options: ["brand-1", "brand-2", "brand-3", "brand-4"] },
    { key: "notes", label: "Notes", type: "text" },
  ] },
  people: { table: "people", singular: "Profile", plural: "Profiles", nameKey: "display_name", fields: [
    { key: "display_name", label: "Display name", type: "text" },
  ] },
  business_managers: { table: "business_managers", singular: "Business Manager", plural: "Business Managers", nameKey: "name", fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "status", label: "Status", type: "select", options: STATUS_ACC },
  ] },
  profile_bm_roles: { table: "profile_bm_roles", singular: "BM role", plural: "BM roles", nameKey: "role", hidden: true, fields: [
    { key: "person_id", label: "Profile", type: "relation", target: "people" },
    { key: "bm_id", label: "Business Manager", type: "relation", target: "business_managers" },
    { key: "role", label: "Role", type: "select", options: ["admin", "employee"] },
  ] },
  bm_partners: { table: "bm_partners", singular: "BM partnership", plural: "BM partnerships", nameKey: "id", hidden: true, fields: [
    { key: "bm_a", label: "BM", type: "relation", target: "business_managers" },
    { key: "bm_b", label: "Partner BM", type: "relation", target: "business_managers" },
  ] },
  pages: { table: "pages", singular: "Page", plural: "Pages", nameKey: "name", fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "brand_id", label: "Brand", type: "relation", target: "brands" },
    { key: "bm_id", label: "Business Manager", type: "relation", target: "business_managers" },
  ] },
  datasets: { table: "datasets", singular: "Dataset", plural: "Datasets", nameKey: "name", fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "bm_id", label: "Business Manager", type: "relation", target: "business_managers" },
  ] },
  domains: { table: "domains", singular: "Domain", plural: "Domains", nameKey: "name", fields: [
    { key: "name", label: "Domain", type: "text" },
    { key: "brand_id", label: "Brand", type: "relation", target: "brands" },
    { key: "bm_id", label: "Business Manager", type: "relation", target: "business_managers" },
  ] },
  ad_accounts: { table: "ad_accounts", singular: "Ad account", plural: "Ad accounts", nameKey: "name", fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "platform", label: "Platform", type: "select", options: ["facebook", "tiktok", "snapchat", "google"] },
    { key: "status", label: "Status", type: "select", options: STATUS_ACC },
    { key: "brand_id", label: "Brand", type: "relation", target: "brands" },
    { key: "bm_id", label: "Business Manager", type: "relation", target: "business_managers", showIf: (r) => r.platform === "facebook" },
    { key: "dataset_id", label: "Pixel / dataset", type: "relation", target: "datasets" },
    { key: "spanda_expires_at", label: "Spanda plan expires", type: "date" },
  ] },
  creatives: { table: "creatives", singular: "Creative", plural: "Creatives", nameKey: "name", fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "format", label: "Format", type: "select", options: ["video", "image", "carousel"] },
    { key: "status", label: "Status", type: "select", options: ["active", "paused", "retired"] },
    { key: "brand_id", label: "Brand", type: "relation", target: "brands" },
  ] },
  campaigns: { table: "campaigns", singular: "Campaign", plural: "Campaigns", nameKey: "name", fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "product", label: "Product", type: "text" },
    { key: "status", label: "Status", type: "select", options: ["active", "paused", "killed"] },
    { key: "brand_id", label: "Brand", type: "relation", target: "brands" },
    { key: "ad_account_id", label: "Ad account", type: "relation", target: "ad_accounts" },
  ] },
  campaign_creatives: { table: "campaign_creatives", singular: "Creative link", plural: "Creative links", nameKey: "id", hidden: true, fields: [
    { key: "campaign_id", label: "Campaign", type: "relation", target: "campaigns" },
    { key: "creative_id", label: "Creative", type: "relation", target: "creatives" },
  ] },
  campaign_daily: { table: "campaign_daily", singular: "Daily stats", plural: "Daily stats", nameKey: "day", hidden: true, fields: [
    { key: "campaign_id", label: "Campaign", type: "relation", target: "campaigns" },
    { key: "day", label: "Day", type: "date" },
    { key: "spend", label: "Spend", type: "money" },
    { key: "revenue", label: "Revenue", type: "money" },
  ] },
  orders_daily: { table: "orders_daily", singular: "Orders day", plural: "Orders", nameKey: "day", fields: [
    { key: "day", label: "Day", type: "date" },
    { key: "brand_id", label: "Brand", type: "relation", target: "brands" },
    { key: "orders", label: "Orders", type: "number" },
    { key: "confirmed", label: "Confirmed", type: "number" },
    { key: "delivered", label: "Delivered", type: "number" },
    { key: "returned", label: "Returned", type: "number" },
    { key: "revenue", label: "Revenue (in row currency)", type: "number" },
    { key: "currency", label: "Currency", type: "select", options: ["USD", "EUR", "MAD", "SAR"] },
  ] },
  expenses: { table: "expenses", singular: "Expense", plural: "Expenses", nameKey: "name", fields: [
    { key: "name", label: "Description", type: "text" },
    { key: "category", label: "Category", type: "select", options: ["product_cost", "shipping", "tools", "subscription", "other"] },
    { key: "amount", label: "Amount", type: "money" },
    { key: "day", label: "Day", type: "date" },
    { key: "brand_id", label: "Brand", type: "relation", target: "brands" },
    { key: "ad_account_id", label: "Ad account", type: "relation", target: "ad_accounts" },
    { key: "campaign_id", label: "Campaign", type: "relation", target: "campaigns" },
  ] },
  tasks: { table: "tasks", singular: "Task", plural: "Tasks", nameKey: "title", fields: [
    { key: "title", label: "Title", type: "text" },
    { key: "priority", label: "Priority", type: "select", options: ["high", "medium", "low"] },
    { key: "task_date", label: "Date", type: "date" },
    { key: "brand_id", label: "Brand", type: "relation", target: "brands" },
    { key: "ad_account_id", label: "Ad account", type: "relation", target: "ad_accounts" },
    { key: "campaign_id", label: "Campaign", type: "relation", target: "campaigns" },
  ] },
};

export const ENTITY_TYPES = Object.keys(ENTITIES) as EntityType[];

/** All (type, field) pairs that point at a given entity type. */
export function referencesTo(target: EntityType) {
  const out: { type: EntityType; key: string }[] = [];
  for (const t of ENTITY_TYPES) for (const f of ENTITIES[t].fields) if (f.type === "relation" && f.target === target) out.push({ type: t, key: f.key });
  return out;
}

export function titleOf(type: EntityType, r: Row | undefined, lookup?: (t: EntityType, id: string) => Row | undefined): string {
  if (!r) return "—";
  const cfg = ENTITIES[type];
  if (type === "profile_bm_roles" && lookup) return `${lookup("people", r.person_id)?.display_name ?? "?"} · ${r.role}`;
  if (type === "bm_partners" && lookup) return `${lookup("business_managers", r.bm_a)?.name ?? "?"} ↔ ${lookup("business_managers", r.bm_b)?.name ?? "?"}`;
  if (type === "campaign_creatives" && lookup) return lookup("creatives", r.creative_id)?.name ?? "Creative";
  if (type === "orders_daily" && lookup) return `${lookup("brands", r.brand_id)?.name ?? ""} · ${r.day}`;
  return String(r[cfg.nameKey] ?? "Untitled");
}

export const statusTone: Record<string, string> = {
  active: "text-success border-success/30",
  restricted: "text-warning border-warning/30",
  paused: "text-warning border-warning/30",
  disabled: "text-danger border-danger/30",
  killed: "text-danger border-danger/30",
  retired: "text-muted-foreground",
};

export const brandDot: Record<string, string> = { "brand-1": "bg-brand-1", "brand-2": "bg-brand-2", "brand-3": "bg-brand-3", "brand-4": "bg-brand-4" };
export const platformLabel: Record<string, string> = { facebook: "Facebook", tiktok: "TikTok", snapchat: "Snapchat", google: "Google Ads" };
