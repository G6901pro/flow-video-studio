import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Code2, CreditCard, History, Image, LogOut, Menu, MessageSquare, PanelLeftClose, Plus, Search, Settings, Sparkles, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { conversationsOptions, profileOptions } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV = [
  { to: "/app", label: "AI Chat & Writing", icon: MessageSquare },
  { to: "/app/code", label: "Code Studio", icon: Code2 },
  { to: "/app/research", label: "Research", icon: Search },
  { to: "/app/images", label: "Image Studio", icon: Image },
  { to: "/app/history", label: "Chat History", icon: History },
  { to: "/app/usage", label: "Credits & Usage", icon: Zap },
  { to: "/app/billing", label: "Subscription & Billing", icon: CreditCard },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const account = useQuery(profileOptions);
  const history = useQuery(conversationsOptions);
  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }
  async function goal(primary_goal: string) {
    if (!account.data) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ primary_goal, onboarded: true }).eq("id", account.data.user.id);
    setSaving(false);
    if (error) { toast.error("Could not save your preference."); return; }
    await qc.invalidateQueries({ queryKey: ["profile"] });
    if (primary_goal === "coding") navigate({ to: "/app/code" });
    if (primary_goal === "research") navigate({ to: "/app/research" });
    if (primary_goal === "creative") navigate({ to: "/app/images" });
  }
  return <div className="flex min-h-dvh bg-background">
    {open && <div className="fixed inset-0 z-30 bg-background/80 md:hidden" onClick={() => setOpen(false)} />}
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border bg-sidebar transition-transform md:sticky md:top-0 md:h-dvh", open ? "translate-x-0" : "-translate-x-full md:translate-x-0", collapsed && "md:w-20")}>
      <div className="flex h-20 items-center justify-between px-5">{!collapsed && <Logo />}<Button variant="ghost" size="icon" title="Collapse sidebar" aria-label="Collapse sidebar" onClick={() => { setCollapsed(!collapsed); setOpen(false); }}><PanelLeftClose /></Button></div>
      <div className="px-3"><Button className="w-full" title="New chat" onClick={() => { navigate({ to: "/app", search: {} }); setOpen(false); }}><Plus />{!collapsed && "New Chat"}</Button></div>
      <nav className="mt-6 space-y-1 px-3" aria-label="Workspace">{NAV.map(({ to, label, icon: Icon }) => <Button asChild variant="ghost" key={to} className={cn("w-full justify-start text-muted-foreground", path.replace(/\/$/, "") === to && "bg-sidebar-accent text-foreground", collapsed && "justify-center")} title={label}><Link to={to} onClick={() => setOpen(false)}><Icon />{!collapsed && label}</Link></Button>)}</nav>
      {!collapsed && <div className="mt-8 min-h-0 flex-1 overflow-y-auto px-4"><p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Recent conversations</p>{history.data?.slice(0, 6).map((c) => <Button asChild variant="ghost" className="mb-1 h-auto w-full justify-start py-2 text-xs text-muted-foreground" key={c.id}><Link to={c.mode === "code" ? "/app/code" : c.mode === "research" ? "/app/research" : "/app"} search={{ conversation: c.id }}><span className="truncate">{c.pinned ? "★ " : ""}{c.title}</span></Link></Button>)}</div>}
      <div className="mt-auto border-t border-border p-3">{!collapsed && <p className="truncate px-2 pb-2 text-xs text-muted-foreground">{account.data?.profile?.display_name || account.data?.user.email}</p>}<Button variant="ghost" className="w-full justify-start text-muted-foreground" title="Sign out" onClick={signOut}><LogOut />{!collapsed && "Sign out"}</Button></div>
    </aside>
    <div className="min-w-0 flex-1"><div className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden"><Logo /><Button variant="ghost" size="icon" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button></div>
      <div key={path} aria-hidden><div className="page-glow-halo" /><div className="page-glow-bar" /></div>
      <div key={`${path}-c`} className="page-transition">{children}</div>
    </div>
    <Dialog open={Boolean(account.data?.profile && !account.data.profile.onboarded)}><DialogContent className="max-w-md [&>button]:hidden" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}><Sparkles className="size-8 text-cyan" /><DialogTitle>Welcome to Xenix AI</DialogTitle><DialogDescription>What would you like to focus on?</DialogDescription><div className="grid grid-cols-2 gap-3">{([{ value: "coding", label: "Coding" }, { value: "writing", label: "Writing" }, { value: "research", label: "Research" }, { value: "creative", label: "Creative Work" }]).map(({ value, label }) => <Button key={value} variant="outline" disabled={saving} onClick={() => goal(value)}>{label}</Button>)}</div></DialogContent></Dialog>
  </div>;
}