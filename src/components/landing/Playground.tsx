import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, ArrowUp, FlaskConical, Loader2, Radio } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading } from "@/components/site/PageShell";
import { Markdown } from "@/components/chat/Markdown";
import { useSession } from "@/hooks/use-session";
import { sendChat } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "openai", label: "OpenAI", model: "openai/gpt-5.4-mini", name: "GPT-5.4 mini" },
  { key: "claude", label: "Claude", model: "anthropic/claude-sonnet-5", name: "Claude Sonnet 5" },
  { key: "gemini", label: "Gemini", model: "google/gemini-3.8-flash", name: "Gemini 3.8 Flash" },
] as const;

const EXAMPLES = ["Explain closures in JavaScript simply", "Draft a friendly product update email", "Give me 5 names for a coffee brand"];

type Msg = { role: "user" | "assistant"; content: string; label?: string; simulated?: boolean };

function simulate(prompt: string, name: string) {
  return `**Simulated response** — this is a demo, not output from ${name}.\n\nYou asked: _"${prompt.slice(0, 120)}"_\n\nSign in to send this prompt to the real model and get a live answer. Live responses use credits from your plan.`;
}

export function Playground() {
  const { session } = useSession();
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[2]);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = useServerFn(sendChat);
  const live = !!session;

  async function submit(text: string) {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setError(null);
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: prompt }]);
    setLoading(true);
    try {
      if (!live) {
        await new Promise((r) => setTimeout(r, 700));
        setMsgs((m) => [...m, { role: "assistant", content: simulate(prompt, tab.name), label: `${tab.name} · simulated`, simulated: true }]);
      } else {
        const res = await send({ data: { conversationId: null, mode: "chat", model: tab.model, prompt, ephemeral: true, regenerate: false } });
        setMsgs((m) => [...m, { role: "assistant", content: res.content, label: `${tab.name} · live · ${res.credits} credits` }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="playground" className="mx-auto max-w-7xl px-5 py-24">
      <SectionHeading eyebrow="Playground" title="Try it right here" sub="Switch providers and send a prompt. Signed-out responses are clearly simulated; signed-in responses come from the real model." />
      <div className="glass mx-auto mt-12 max-w-3xl overflow-hidden rounded-3xl shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex gap-1 rounded-xl bg-muted p-1" role="tablist" aria-label="Provider">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab.key === t.key}
                onClick={() => setTab(t)}
                className={cn("rounded-lg px-3 py-1.5 text-sm transition-colors", tab.key === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs", live ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
            {live ? <Radio className="h-3.5 w-3.5" /> : <FlaskConical className="h-3.5 w-3.5" />}
            {live ? "Live mode" : "Demo mode · simulated"}
          </span>
        </div>
        <div className="max-h-[420px] min-h-[260px] space-y-4 overflow-y-auto p-5" aria-live="polite">
          {!msgs.length && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">Pick an example or write your own prompt.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((e) => (
                  <button key={e} onClick={() => submit(e)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-cyan/40 hover:text-foreground">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-sm">{m.content}</div>
            ) : (
              <div key={i} className={cn("max-w-[95%] rounded-2xl border p-4", m.simulated ? "border-warning/30 border-dashed" : "border-border")}>
                <p className="mb-1 text-xs text-muted-foreground">{m.label}</p>
                <Markdown content={m.content} />
              </div>
            ),
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {live ? `${tab.name} is thinking…` : "Preparing simulated reply…"}
            </div>
          )}
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" /> {error}
            </div>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-end gap-2 border-t border-border p-3"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            placeholder={`Message ${tab.name}…`}
            className="max-h-32 min-h-11 resize-none border-0 bg-transparent focus-visible:ring-0"
            aria-label="Prompt"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || loading} aria-label="Send">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
        {!live && (
          <p className="border-t border-border px-4 py-2.5 text-center text-xs text-muted-foreground">
            <Link to="/auth" search={{ mode: "signup" }} className="text-cyan hover:underline">Create a free account</Link> for live answers.
          </p>
        )}
      </div>
    </section>
  );
}
