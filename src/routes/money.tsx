import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { PlaceholderPage } from "@/components/tb/PlaceholderPage";

export const Route = createFileRoute("/money")({
  head: () => ({
    meta: [
      { title: "Money — The Billionaire" },
      { name: "description", content: "Cash flow, COD remittances, payouts and expenses." },
      { property: "og:title", content: "Money — The Billionaire" },
      { property: "og:description", content: "Cash flow, COD remittances, payouts and expenses." },
    ],
  }),
  component: () => <PlaceholderPage title="Money" icon={Wallet} blurb="Cash flow, COD remittances, payouts and expenses." />,
});
