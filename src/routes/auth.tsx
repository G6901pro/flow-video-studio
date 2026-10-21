import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { workspaceHead } from "@/lib/workspace";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup"]).optional() }),
  head: () => workspaceHead("Sign in", "Sign in or create your Xenix AI account."),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const signup = mode === "signup";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (signup) {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/app" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // Once a session exists (after Google returns here, or popup flow completes), go to the workspace.
  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      navigate({ to: "/app", replace: true });
    };
    supabase.auth.getSession().then(({ data }) => data.session && go());
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) go();
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function google() {
    setBusy(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
        extraParams: { prompt: "select_account" },
      });
      if (r.redirected) return;
      if (r.error) throw r.error;
      navigate({ to: "/app", replace: true });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="glass w-full max-w-sm rounded-3xl p-8 shadow-glow">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold">{signup ? "Create your account" : "Welcome back"}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{signup ? "Sign up" : "Sign in"}</Button>
        </form>
        {!signup && <Button asChild variant="link" className="mt-2 px-0 text-xs"><Link to="/forgot-password">Forgot password?</Link></Button>}
        <Button variant="outline" className="mt-3 w-full" disabled={busy} onClick={google}>Continue with Google</Button>
        <Button variant="ghost" className="mt-5 h-auto w-full whitespace-normal text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate({ to: "/auth", search: { mode: signup ? "signin" : "signup" } })}>
          {signup ? "Already have an account? Sign in" : "New here? Create an account"}
        </Button>
      </div>
    </div>
  );
}
