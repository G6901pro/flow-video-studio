import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/PageShell";
import { PLANS } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function Pricing() {
  const plans = [PLANS.free, PLANS.pro, PLANS.enterprise];
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-5 py-24">
      <SectionHeading eyebrow="Pricing" title="Simple, honest plans" sub="Monthly billing. Credits reset at the start of each calendar month." />
      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {plans.map((p) => {
          const pro = p.id === "pro";
          return (
            <div key={p.id} className={cn("relative rounded-3xl border p-7", pro ? "border-cyan/40 bg-card shadow-glow" : "border-border bg-card/60")}>
              {pro && (
                <span className="absolute -top-3 left-7 rounded-full bg-gradient-brand px-3 py-1 text-xs font-medium text-primary-foreground">Most flexible</span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold">{p.priceLabel}</span>
                {p.id !== "enterprise" && <span className="text-sm text-muted-foreground">/month</span>}
              </p>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full" variant={pro ? "default" : "outline"}>
                {p.id === "enterprise" ? (
                  <a href="mailto:sales@xenix.ai?subject=Xenix%20AI%20Enterprise">Contact sales</a>
                ) : (
                  <Link to="/auth" search={{ mode: "signup" }}>{p.id === "free" ? "Start free" : "Get started"}</Link>
                )}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
        Xenix AI is a unified interface to third-party AI models. Model availability depends on connected providers and their usage terms. Paid checkout is being set up — until it's live, Pro upgrades aren't charged and accounts run on the Free plan.
      </p>
    </section>
  );
}
