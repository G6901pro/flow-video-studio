import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Code2, Globe2, ImageIcon, LayoutGrid, MessageSquareText, Route as RouteIcon, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/site/PageShell";
import { cn } from "@/lib/utils";

const CARDS = [
  { icon: MessageSquareText, title: "AI Chat & Writing", desc: "Generate content, summaries, ideas, translations and detailed answers.", to: "/app", span: "md:col-span-2", tint: "from-cyan/20", demo: ["Summarize", "Translate", "Brainstorm", "Rewrite"] },
  { icon: Code2, title: "Code Studio", desc: "Generate code, debug issues, explain concepts and scaffold web apps.", to: "/app/code", span: "", tint: "from-blue/25", demo: ["React", "TypeScript", "SQL"] },
  { icon: Globe2, title: "Research Mode", desc: "Search-enabled Gemini answers. Review model-supplied links; citations are not independently verified.", to: "/app/research", span: "", tint: "from-violet/25", demo: ["Web search"] },
  { icon: ImageIcon, title: "Creative Studio", desc: "Generate images and short videos from text with style and aspect controls.", to: "/app/images", span: "md:col-span-2", tint: "from-violet/20", demo: ["Cinematic", "3D", "Watercolor", "Product"] },
  { icon: RouteIcon, title: "Smart Model Routing", desc: "Pick a model yourself or let Xenix Auto route by task.", to: "/models", span: "", tint: "from-cyan/20", demo: ["Auto"] },
  { icon: LayoutGrid, title: "Unified Workspace", desc: "Chats, usage and settings in one place, with search, pin and rename.", to: "/app", span: "md:col-span-2", tint: "from-blue/20", demo: ["History", "Usage", "Settings"] },
] as const;

export function Bento() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-24">
      <SectionHeading eyebrow="Features" title="Everything you reach for, in one place" sub="Focused tools with saved conversations, a private image gallery and one credit balance." />
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {CARDS.map((c, i) => (
          <BentoCard key={c.title} card={c} index={i} />
        ))}
      </div>
    </section>
  );
}

function BentoCard({ card, index }: { card: (typeof CARDS)[number]; index: number }) {
  const [active, setActive] = useState(0);
  const Icon = card.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={cn("group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-cyan/40", card.span)}
    >
      <div aria-hidden className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-60 transition-opacity group-hover:opacity-100", card.tint)} />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between">
          <span className="glass inline-flex h-10 w-10 items-center justify-center rounded-xl">
            <Icon className="h-5 w-5 text-cyan" />
          </span>
          <Link to={card.to} className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Open ${card.title}`}>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <h3 className="mt-5 text-lg font-semibold">{card.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          {card.demo.map((d, i) => (
            <button
              key={d}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={cn("rounded-full border px-3 py-1 text-xs transition-colors", i === active ? "border-cyan/50 bg-cyan/10 text-foreground" : "border-border text-muted-foreground")}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
