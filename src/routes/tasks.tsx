import { createFileRoute } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";
import { PlaceholderPage } from "@/components/tb/PlaceholderPage";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — The Billionaire" },
      { name: "description", content: "Recurring routines, history and long-term to-dos." },
      { property: "og:title", content: "Tasks — The Billionaire" },
      { property: "og:description", content: "Recurring routines, history and long-term to-dos." },
    ],
  }),
  component: () => <PlaceholderPage title="Tasks" icon={ListChecks} blurb="Recurring routines, history and long-term to-dos." />,
});
