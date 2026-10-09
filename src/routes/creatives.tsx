import { createFileRoute } from "@tanstack/react-router";
import { Image } from "lucide-react";
import { PlaceholderPage } from "@/components/tb/PlaceholderPage";

export const Route = createFileRoute("/creatives")({
  head: () => ({
    meta: [
      { title: "Creatives — The Billionaire" },
      { name: "description", content: "Ad creatives library with hook and performance tracking." },
      { property: "og:title", content: "Creatives — The Billionaire" },
      { property: "og:description", content: "Ad creatives library with hook and performance tracking." },
    ],
  }),
  component: () => <PlaceholderPage title="Creatives" icon={Image} blurb="Ad creatives library with hook and performance tracking." />,
});
