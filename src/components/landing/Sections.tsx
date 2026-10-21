import { Link } from "@tanstack/react-router";
import { BookOpen, Briefcase, GraduationCap, Megaphone, Rocket, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/PageShell";

const FLOWS = ["Draft → refine → translate", "Spec → code → explain", "Question → search → cite", "Idea → image → iterate"];

export function Workflows() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">Built for everyday workflows</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FLOWS.map((f) => (
          <div key={f} className="rounded-xl border border-border bg-card/50 px-4 py-3 text-center text-sm text-muted-foreground">{f}</div>
        ))}
      </div>
    </section>
  );
}

const CASES = [
  { icon: Terminal, title: "Developers", desc: "Scaffold components, debug errors and learn new APIs." },
  { icon: Megaphone, title: "Marketers", desc: "Draft campaigns, rewrite copy and generate visuals." },
  { icon: GraduationCap, title: "Students", desc: "Research topics with sources and get clear explanations." },
  { icon: Briefcase, title: "Founders", desc: "Write specs, summarize docs and explore ideas fast." },
  { icon: BookOpen, title: "Writers", desc: "Outline, edit and translate with model choice." },
  { icon: Rocket, title: "Product teams", desc: "Compare model answers on the same task." },
];

export function UseCases() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <SectionHeading eyebrow="Use cases" title="One workspace, many kinds of work" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CASES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-4 rounded-2xl border border-border bg-card/60 p-5">
            <Icon className="h-5 w-5 shrink-0 text-violet" />
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center sm:p-16">
        <div aria-hidden className="absolute inset-0 bg-gradient-brand opacity-10" />
        <h2 className="relative text-3xl font-semibold sm:text-4xl">Start with one workspace today</h2>
        <p className="relative mx-auto mt-4 max-w-lg text-muted-foreground">Free to begin. Upgrade only if you need more.</p>
        <Button asChild size="lg" className="relative mt-8 shadow-glow">
          <Link to="/auth" search={{ mode: "signup" }}>Get Started Free</Link>
        </Button>
      </div>
    </section>
  );
}
