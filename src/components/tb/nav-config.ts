import { Sun, Users, Megaphone, Wallet, ListChecks, Tag, Image, Package, type LucideIcon } from "lucide-react";

export type NavItem = { to: "/" | "/accounts" | "/campaigns" | "/money" | "/tasks" | "/brands" | "/creatives" | "/orders"; label: string; icon: LucideIcon };

export const primaryNav: NavItem[] = [
  { to: "/", label: "Today", icon: Sun },
  { to: "/accounts", label: "Accounts", icon: Users },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/money", label: "Money", icon: Wallet },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
];

export const moreNav: NavItem[] = [
  { to: "/brands", label: "Brands", icon: Tag },
  { to: "/creatives", label: "Creatives", icon: Image },
  { to: "/orders", label: "Orders", icon: Package },
];

export const allNav = [...primaryNav, ...moreNav];
