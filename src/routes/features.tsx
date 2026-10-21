import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Bento } from "@/components/landing/Bento";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Features — Xenix AI" },
      { name: "description", content: "AI chat, Code Studio, Research Mode, Creative Studio and smart model routing in one workspace." },
      { property: "og:title", content: "Features — Xenix AI" },
      { property: "og:description", content: "AI chat, Code Studio, Research Mode, Creative Studio and smart model routing in one workspace." },
    ],
  }),
  component: () => (
    <PageShell>
      <Bento />
    </PageShell>
  ),
});
