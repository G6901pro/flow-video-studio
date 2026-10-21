import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Faq } from "@/components/landing/Faq";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "FAQ — Xenix AI" },
      { name: "description", content: "Answers about Xenix AI credits, models, security, images and subscriptions." },
      { property: "og:title", content: "FAQ — Xenix AI" },
      { property: "og:description", content: "Answers about Xenix AI credits, models, security, images and subscriptions." },
    ],
  }),
  component: () => (
    <PageShell>
      <Faq />
    </PageShell>
  ),
});
