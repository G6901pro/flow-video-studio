import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, Copy, Code2, RotateCcw, Search, Sparkles, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UpgradePrompt } from "./UpgradePrompt";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/chat/Markdown";
import { ASSISTANT_NAME, chatCost, type Mode } from "@/lib/catalog";
import { getUsage } from "@/lib/ai.functions";
import { messagesOptions } from "@/lib/workspace";

const EXAMPLES: Record<Mode, string[]> = {
  chat: ["Draft a thoughtful product launch email", "Explain a complex idea simply", "Brainstorm names for my new project", "Translate this message into Spanish"],
  code: ["Build an accessible React navigation component", "Explain TypeScript generics with examples", "Help me debug a JavaScript promise", "Write CSS for a responsive dashboard"],
  research: ["Find recent developments in renewable energy", "Compare current AI coding tools with sources", "Research remote work trends with citations", "Summarize the latest space exploration news"],
};

export function ChatWorkspace({ mode, conversation }: { mode: Mode; conversation: string | undefined }) {
  const [input, setInput] = useState("");
  const [streamed, setStreamed] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<string | null>(null);
  const [stopped, setStopped] = useState(false);
  const active = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const usageFn = useServerFn(getUsage);
  const usage = useQuery({ queryKey: ["usage"], queryFn: () => usageFn() });
  const messages = useQuery(messagesOptions(conversation));
  const rows = messages.data ?? [];
  const Icon = mode === "code" ? Code2 : mode === "research" ? Search : Sparkles;
  const title = mode === "code" ? "Code Studio" : mode === "research" ? "Research" : "AI Chat & Writing";
  useEffect(() => { setOptimistic(null); setError(null); }, [conversation]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [rows.length, pending, streamed]);

  async function submit(prompt = input, regenerate = false) {
    if (pending || (!prompt.trim() && !regenerate)) return;
    const token = ++active.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null); setStopped(false); setPending(true); setStreamed("");
    if (!regenerate) { setOptimistic(prompt); setInput(""); }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again.");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ conversationId: conversation ?? null, mode, prompt: regenerate ? null : prompt.trim(), regenerate }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not send your message.");
      }
      const convId = res.headers.get("x-conversation-id");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        if (token === active.current) setStreamed(text.replace(/\n\n\[\[error:[\s\S]*$/, ""));
      }
      const failure = text.match(/\[\[error:([\s\S]*)\]\]$/);
      if (failure) throw new Error(failure[1]);
      await Promise.all([qc.invalidateQueries({ queryKey: ["conversations"] }), qc.invalidateQueries({ queryKey: ["messages"] }), qc.invalidateQueries({ queryKey: ["usage"] })]);
      if (token !== active.current) return;
      if (convId && convId !== conversation) await navigate({ to: mode === "code" ? "/app/code" : mode === "research" ? "/app/research" : "/app", search: { conversation: convId } });
      setOptimistic(null); setStreamed("");
    } catch (e) {
      if (token !== active.current) return;
      setError(e instanceof Error ? e.message : "Could not send your message.");
      setInput(prompt); setOptimistic(null); setStreamed("");
      await qc.invalidateQueries({ queryKey: ["messages"] });
    } finally { if (token === active.current) setPending(false); }
  }
  return <div className="flex min-h-[calc(100dvh-56px)] flex-col md:min-h-dvh">
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 md:px-8"><div className="flex items-center gap-3"><Icon className="size-5 text-cyan" /><h1 className="text-base font-semibold">{title}</h1></div><div className="flex items-center gap-3">{usage.data?.plan === "free" && <UpgradePrompt className="hidden lg:flex" />}<Button asChild variant="ghost" size="sm"><Link to="/app/usage">{usage.data ? `${usage.data.remaining} credits` : "Credits"}</Link></Button></div></header>
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 md:px-10">
      {!rows.length && !pending && !optimistic ? <div className="flex flex-1 flex-col justify-center py-16"><div className="mb-6 flex size-12 items-center justify-center rounded-lg border border-cyan/20 bg-cyan/10"><Icon className="size-6 text-cyan" /></div><p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Xenix AI / {mode === "chat" ? "Your workspace" : title}</p><h2 className="text-3xl font-semibold md:text-4xl">{mode === "code" ? "What are we building?" : mode === "research" ? "What would you like to explore?" : "Where should we begin?"}</h2><div className="mt-9 grid gap-3 sm:grid-cols-2">{EXAMPLES[mode].map((p) => <Button key={p} variant="outline" className="h-auto min-h-20 justify-between whitespace-normal px-4 py-4 text-left text-sm font-normal" onClick={() => setInput(p)}>{p}<ArrowUp className="shrink-0 text-muted-foreground" /></Button>)}</div></div> : <div className="space-y-8 py-8">{rows.map((m) => <article key={m.id} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-lg bg-secondary px-5 py-3" : "min-w-0"}>{m.role === "assistant" && <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="size-4 text-cyan" />{ASSISTANT_NAME}</p>}<Markdown content={m.content} />{m.role === "assistant" && <div className="mt-2 flex gap-1"><Button variant="ghost" size="icon" title="Copy response" aria-label="Copy response" onClick={async () => { try { await navigator.clipboard.writeText(m.content); toast.success("Response copied."); } catch { toast.error("Clipboard unavailable."); } }}><Copy /></Button>{m.id === rows.at(-1)?.id && <Button variant="ghost" size="icon" title="Regenerate response" aria-label="Regenerate response" disabled={pending} onClick={() => submit("", true)}><RotateCcw /></Button>}</div>}</article>)}{optimistic && !rows.some((r) => r.role === "user" && r.content === optimistic) && <div className="ml-auto max-w-[85%] rounded-lg bg-secondary px-5 py-3 text-sm">{optimistic}</div>}{pending && <article className="min-w-0"><p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="size-4 text-cyan" />{ASSISTANT_NAME}</p>{streamed ? <Markdown content={streamed} /> : <p role="status" className="flex items-center gap-3 text-sm"><span className="ai-glow-dot" /><span className="ai-glow-text font-medium">Thinking…</span></p>}{streamed && <span className="ai-glow-dot mt-2" aria-hidden />}</article>}<div ref={bottom} /></div>}
      <div className="sticky bottom-0 bg-background pb-5 pt-3">{error && <div role="alert" className="mb-3 rounded-md border border-destructive/30 p-3 text-sm">{error}<Button variant="ghost" size="sm" onClick={() => submit()}><RotateCcw />Retry</Button></div>}{stopped && <p className="mb-2 text-xs text-warning">Stopped.</p>}<form onSubmit={(e) => { e.preventDefault(); submit(); }} className="rounded-lg border border-input bg-surface p-3 focus-within:border-cyan/50"><Textarea aria-label="Message" placeholder={mode === "code" ? "Describe your code, or paste a problem…" : mode === "research" ? "Ask a research question…" : "Message your AI assistant…"} value={input} maxLength={8000} onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 220)}px`; }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }} className="min-h-20 resize-none border-0 bg-transparent focus-visible:ring-0" /><div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{chatCost("auto", mode)} credits / request</span>{pending ? <Button type="button" size="icon" aria-label="Stop waiting" title="Stop waiting" onClick={() => { active.current++; abortRef.current?.abort(); setPending(false); setStopped(true); setOptimistic(null); setStreamed(""); }}><Square /></Button> : <Button type="submit" size="icon" aria-label="Send message" disabled={!input.trim()}><ArrowUp /></Button>}</div></form><p className="mt-2 text-center text-[11px] text-muted-foreground">{mode === "code" ? "Generated code has not been executed or tested." : "AI can make mistakes. Verify important information."}</p></div>
    </div>
  </div>;
}