import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden>
      <defs>
        <linearGradient id="xg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--cyan)" />
          <stop offset="0.5" stopColor="var(--blue)" />
          <stop offset="1" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#xg)" opacity="0.16" />
      <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="url(#xg)" strokeOpacity="0.6" />
      <path d="M9 9 L23 23 M23 9 L9 23" stroke="url(#xg)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.4" fill="var(--foreground)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 rounded-md", className)} aria-label="Xenix AI home">
      <LogoMark />
      <span className="font-display text-[1.05rem] font-semibold tracking-tight">
        Xenix <span className="text-gradient">AI</span>
      </span>
    </Link>
  );
}
