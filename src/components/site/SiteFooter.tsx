import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">One Workspace. Every Intelligence. A unified interface for AI chat, writing, coding, research and creative generation.</p>
        </div>
        <FooterCol title="Product" items={[["/features", "Features"], ["/models", "Models"], ["/pricing", "Pricing"]]} />
        <FooterCol title="Resources" items={[["/faq", "FAQ"], ["/auth", "Sign in"]]} />
        <FooterCol title="Workspace" items={[["/app", "Chat"], ["/app/code", "Code Studio"], ["/app/images", "Image Studio"]]} />
      </div>
      <div className="border-t border-border/60">
        <p className="mx-auto max-w-7xl px-5 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Xenix AI. Model availability depends on connected providers and their usage terms.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {items.map(([to, label]) => (
          <li key={to}>
            <Link to={to as "/"} className="text-sm text-muted-foreground hover:text-foreground">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
