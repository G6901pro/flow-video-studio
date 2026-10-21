import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function UpgradePrompt({ className }: { className?: string }) {
  return (
    <Link
      to="/app/billing"
      className={cn(
        "group flex items-center gap-3 rounded-full border border-cyan/30 bg-cyan/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-cyan/60 hover:text-foreground",
        className,
      )}
    >
      <Zap className="size-4 shrink-0 text-cyan" />
      <span>Upgrade to Pro for 150 daily credits &amp; priority generation</span>
    </Link>
  );
}
