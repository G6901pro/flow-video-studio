import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Pricing } from "@/components/landing/Pricing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Pricing — Xenix AI" },
      { name: "description", content: "Free, Pro and Enterprise plans for Xenix AI with transparent monthly credits." },
      { property: "og:title", content: "Pricing — Xenix AI" },
      { property: "og:description", content: "Free, Pro and Enterprise plans for Xenix AI with transparent monthly credits." },
    ],
  }),
  component: () => (
    <PageShell>
      <Pricing />
    </PageShell>
  ),
});
