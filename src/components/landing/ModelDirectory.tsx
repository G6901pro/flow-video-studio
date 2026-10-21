import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/site/PageShell";
import { MODELS, type Category } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const CATS: ("All" | Category)[] = ["All", "Chat", "Writing", "Coding", "Research", "Image Generation", "Video Generation"];

export function ModelDirectory() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const list = useMemo(
    () =>
      MODELS.filter((m) => (cat === "All" || m.categories.includes(cat)) && `${m.label} ${m.provider} ${m.id}`.toLowerCase().includes(q.toLowerCase())),
    [q, cat],
  );
  return (
    <section id="models" className="mx-auto max-w-7xl px-5 py-24">
      <SectionHeading
        eyebrow="Models"
        title="A directory of connected models"
        sub="Every card shows the real model identifier this workspace calls. Availability reflects what is switched on right now."
      />
      <div className="mt-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search models or providers" className="pl-9" aria-label="Search models" />
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
          {CATS.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors", cat === c ? "border-cyan/50 bg-cyan/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground")}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m) => (
          <article key={m.id} className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-cyan/40">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{m.provider}</span>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px]", m.available ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", m.available ? "bg-success" : "bg-muted-foreground")} />
                {m.available ? "Available" : "Not configured"}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-semibold">{m.label}</h3>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{m.id === "auto" ? "task-based routing" : m.id === "video" ? "no provider enabled" : m.id}</p>
            <p className="mt-3 text-sm text-muted-foreground">{m.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {m.categories.map((c) => (
                <span key={c} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{c}</span>
              ))}
              {m.available && (
                <span className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  {m.credits} credit{m.credits === 1 ? "" : "s"} · {m.tier === "premium" ? "Pro" : "Free"}
                </span>
              )}
            </div>
          </article>
        ))}
        {!list.length && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No models match your search.</p>}
      </div>
      <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-muted-foreground">
        Chat, research and image models run through Xenix AI's built-in AI connection — no personal API keys needed.
      </p>
    </section>
  );
}
