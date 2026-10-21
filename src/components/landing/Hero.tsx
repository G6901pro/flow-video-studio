import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:pt-24">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
        <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-cyan" /> One Workspace. Every Intelligence.
        </span>
        <h1 className="mt-6 text-4xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
          One Platform. <br className="hidden sm:block" />
          <span className="text-gradient">All World-Class AI Models.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Chat, code, research, and create with leading AI models in one seamless workspace.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="shadow-glow">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="glass">
            <Link to="/models">Explore Models</Link>
          </Button>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="mt-16">
        <DashboardPreview />
      </motion.div>
    </section>
  );
}

const DEMO = [
  {
    model: "Claude Sonnet 5",
    provider: "Anthropic",
    q: "Write a debounce hook in TypeScript",
    a: "Here's a typed, cancel-safe hook:",
    code: ["export function useDebounce<T>(value: T, ms = 300) {", "  const [v, setV] = useState(value);", "  useEffect(() => {", "    const t = setTimeout(() => setV(value), ms);", "    return () => clearTimeout(t);", "  }, [value, ms]);", "  return v;", "}"],
  },
  {
    model: "GPT-6 Astra",
    provider: "OpenAI",
    q: "Summarize this launch brief in 3 bullets",
    a: "• Audience: product teams\n• Goal: unify AI tooling\n• Timeline: phased rollout",
    code: null,
  },
  {
    model: "Gemini 3.8 Flash",
    provider: "Google",
    q: "Research: what is WebGPU used for?",
    a: "WebGPU gives web apps modern GPU access for rendering and compute — see sources [1][2].",
    code: null,
  },
];

function DashboardPreview() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % DEMO.length), 4200);
    return () => clearInterval(t);
  }, [reduce]);
  const d = DEMO[i]!;
  return (
    <div className="relative mx-auto max-w-5xl">
      <div aria-hidden className="absolute -inset-px rounded-3xl bg-gradient-brand opacity-30 blur-2xl" />
      <div className="glass relative overflow-hidden rounded-3xl shadow-glow">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-muted" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted" />
          <span className="ml-3 text-xs text-muted-foreground">Xenix AI · Workspace preview</span>
          <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Illustrative</span>
        </div>
        <div className="grid md:grid-cols-[220px_1fr]">
          <aside className="hidden border-r border-border p-4 md:block">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Models</p>
            <ul className="mt-3 space-y-1">
              {DEMO.map((m, idx) => (
                <li key={m.model}>
                  <button
                    onClick={() => setI(idx)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${idx === i ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {m.model}
                    <span className="h-1.5 w-1.5 rounded-full bg-success" aria-label="online" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-xl border border-border p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Credits</span>
                <span className="font-medium">1,240 / 2,000</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[62%] rounded-full bg-gradient-brand" />
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Sample values</p>
            </div>
          </aside>
          <div className="min-h-[360px] p-5 sm:p-7">
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }} className="space-y-4">
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-sm">{d.q}</div>
                <div className="max-w-[92%] space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="h-3.5 w-3.5 text-cyan" /> {d.model} · {d.provider}
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{d.a}</p>
                  {d.code && (
                    <pre className="overflow-x-auto rounded-xl border border-border bg-background/80 p-4 font-mono text-[12.5px] leading-relaxed">
                      {d.code.map((line, n) => (
                        <div key={n}>
                          <span className="mr-4 select-none text-muted-foreground/50">{n + 1}</span>
                          <span className={line.includes("export") || line.includes("return") ? "text-violet" : line.includes("use") ? "text-cyan" : ""}>{line}</span>
                        </div>
                      ))}
                    </pre>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
