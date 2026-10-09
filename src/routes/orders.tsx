import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { PlaceholderPage } from "@/components/tb/PlaceholderPage";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — The Billionaire" },
      { name: "description", content: "COD orders, confirmations, deliveries and returns." },
      { property: "og:title", content: "Orders — The Billionaire" },
      { property: "og:description", content: "COD orders, confirmations, deliveries and returns." },
    ],
  }),
  component: () => <PlaceholderPage title="Orders" icon={Package} blurb="COD orders, confirmations, deliveries and returns." />,
});
