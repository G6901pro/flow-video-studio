import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHeading } from "@/components/site/PageShell";

export const FAQS = [
  ["What is Xenix AI?", "Xenix AI is a single workspace for AI chat, writing, coding, web research and image generation. You pick a model (or let Xenix Auto choose) and keep all conversations, usage and settings in one place."],
  ["How do AI credits work?", "Chat requests cost 1–4 credits, research adds 2, each image costs 5 and each video (up to 10 seconds) costs 15. Free accounts get 40 credits every day and Pro gets 150; credits refill daily at midnight UTC."],
  ["Which AI models can I use?", "Currently connected: GPT-6 Astra and GPT-5.4 mini (OpenAI), Claude Sonnet 5 (Anthropic), Gemini 3.8 Flash (Google) and GPT Image 2.5 for images. Free accounts use the efficient models; Pro unlocks the premium ones and priority generation. The Models page always shows exactly what is available."],
  ["Why use one workspace instead of multiple subscriptions?", "One history, one balance and one interface means less context switching. You can compare models on the same task without juggling several apps. Whether it saves money depends on how you use each provider."],
  ["Can I use Xenix AI for coding and web development?", "Yes. Code Studio generates, explains and debugs code with syntax highlighting and copy buttons. Code is not executed or tested by Xenix AI — always review and run it yourself."],
  ["Does Xenix AI generate images and videos?", "Yes — Image Studio creates images (5 credits) and short videos up to 10 seconds (15 credits) on every plan, as long as you have credits left."],
  ["Is my data secure?", "Your conversations are private to your account and protected by per-user access rules. AI requests are sent from our servers, and no provider keys are ever exposed in your browser. Prompts are processed by the model provider you select."],
  ["Can I cancel my subscription?", "Paid checkout isn't live yet, so no one is being charged today. Once billing launches, you'll be able to cancel any time and keep access until the end of your billing period."],
] as const;

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-24">
      <SectionHeading eyebrow="FAQ" title="Questions, answered plainly" />
      <Accordion type="single" collapsible className="mt-12">
        {FAQS.map(([q, a]) => (
          <AccordionItem key={q} value={q}>
            <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
