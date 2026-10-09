import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { PlaceholderPage } from "@/components/tb/PlaceholderPage";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — The Billionaire" },
      { name: "description", content: "Live campaigns across TikTok, Snapchat, Google and Meta." },
      { property: "og:title", content: "Campaigns — The Billionaire" },
      { property: "og:description", content: "Live campaigns across TikTok, Snapchat, Google and Meta." },
    ],
  }),
  component: () => <PlaceholderPage title="Campaigns" icon={Megaphone} blurb="Live campaigns across TikTok, Snapchat, Google and Meta." />,
});
