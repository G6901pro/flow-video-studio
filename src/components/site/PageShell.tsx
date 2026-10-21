import type { ReactNode } from "react";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]">
        <div className="absolute left-1/2 top-[-200px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-blue/20 blur-[140px]" />
        <div className="absolute right-[-10%] top-[200px] h-[400px] w-[500px] rounded-full bg-violet/15 blur-[120px]" />
        <div className="absolute left-[-10%] top-[300px] h-[300px] w-[400px] rounded-full bg-cyan/10 blur-[120px]" />
        <div className="grid-fade absolute inset-0" />
      </div>
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function SectionHeading({ eyebrow, title, sub, id }: { eyebrow: string; title: ReactNode; sub?: string; id?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-3xl font-semibold sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-muted-foreground">{sub}</p>}
    </div>
  );
}
