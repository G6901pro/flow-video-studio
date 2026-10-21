import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { ModelDirectory } from "@/components/landing/ModelDirectory";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "AI Models — Xenix AI" },
      { name: "description", content: "Browse the OpenAI, Anthropic and Google models connected to Xenix AI, with capabilities and availability." },
      { property: "og:title", content: "AI Models — Xenix AI" },
      { property: "og:description", content: "Browse the OpenAI, Anthropic and Google models connected to Xenix AI, with capabilities and availability." },
    ],
  }),
  component: () => (
    <PageShell>
      <ModelDirectory />
    </PageShell>
  ),
});
