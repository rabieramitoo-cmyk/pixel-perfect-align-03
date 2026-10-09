import { createFileRoute } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import { PlaceholderPage } from "@/components/tb/PlaceholderPage";

export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: "Brands — The Billionaire" },
      { name: "description", content: "Your stores, products and brand-level performance." },
      { property: "og:title", content: "Brands — The Billionaire" },
      { property: "og:description", content: "Your stores, products and brand-level performance." },
    ],
  }),
  component: () => <PlaceholderPage title="Brands" icon={Tag} blurb="Your stores, products and brand-level performance." />,
});
