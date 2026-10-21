import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Hero } from "@/components/landing/Hero";
import { Bento } from "@/components/landing/Bento";
import { ModelDirectory } from "@/components/landing/ModelDirectory";
import { Playground } from "@/components/landing/Playground";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { FinalCta, UseCases, Workflows } from "@/components/landing/Sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Xenix AI — One Platform. All World-Class AI Models." },
      { name: "description", content: "Chat, code, research and create with OpenAI, Claude and Gemini models in one seamless workspace." },
      { property: "og:title", content: "Xenix AI — One Workspace. Every Intelligence." },
      { property: "og:description", content: "Chat, code, research and create with leading AI models in one seamless workspace." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PageShell>
      <Hero />
      <Workflows />
      <Bento />
      <ModelDirectory />
      <Playground />
      <UseCases />
      <Pricing />
      <Faq />
      <FinalCta />
    </PageShell>
  );
}
