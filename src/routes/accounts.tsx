import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PlaceholderPage } from "@/components/tb/PlaceholderPage";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — The Billionaire" },
      { name: "description", content: "Every ad account, its status, spend limits and renewal dates." },
      { property: "og:title", content: "Accounts — The Billionaire" },
      { property: "og:description", content: "Every ad account, its status, spend limits and renewal dates." },
    ],
  }),
  component: () => <PlaceholderPage title="Accounts" icon={Users} blurb="Every ad account, its status, spend limits and renewal dates." />,
});
