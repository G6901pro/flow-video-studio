import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  IMAGE_MODEL,
  IMAGE_COST,
  ASPECT_RATIOS,
  dayStart,
  type AspectRatio,
  PLANS,
  RATE_LIMIT_PER_MINUTE,
  canUseModel,
  chatCost,
  getModel,
  quotaCheck,
  resolveForPlan,
  type Mode,
  type PlanId,
} from "./catalog";

export type Ctx = { supabase: any; userId: string };

export const SYSTEM: Record<Mode, string> = {
  chat: "You are Xenix AI, a helpful, precise assistant for writing, ideas, summaries and answers. Use Markdown formatting when it helps readability.",
  code: "You are Xenix AI Code Studio, an expert software engineer. Answer with clear explanations and fenced code blocks labeled with the language. You cannot execute or test code; never claim code was run or tested.",
  research:
    "You are Xenix AI Research Mode. Use web search to ground answers. Cite sources inline as Markdown links and end with a 'Sources' list of links. If you are unsure, say so.",
};

export async function loadAccount(ctx: Ctx) {
  const { data: sub } = await ctx.supabase.from("subscriptions").select("plan,status").eq("user_id", ctx.userId).maybeSingle();
  const plan: PlanId = sub?.status === "active" && sub?.plan ? (sub.plan as PlanId) : "free";
  const { data: events } = await ctx.supabase
    .from("usage_events")
    .select("credits,created_at")
    .eq("user_id", ctx.userId)
    .gte("created_at", dayStart());
  const rows = (events ?? []) as { credits: number; created_at: string }[];
  const used = rows.reduce((s, e) => s + e.credits, 0);
  const oneMinAgo = Date.now() - 60_000;
  const recent = rows.filter((e) => new Date(e.created_at).getTime() > oneMinAgo).length;
  return { plan, used, recent };
}

export async function guard(ctx: Ctx, cost: number) {
  const acct = await loadAccount(ctx);
  if (acct.recent >= RATE_LIMIT_PER_MINUTE) throw new Error("You're sending requests too quickly. Please wait a minute and try again.");
  const q = quotaCheck(acct.used, cost, acct.plan);
  if (!q.allowed)
    throw new Error(`Not enough credits: this request needs ${cost} and you have ${q.remaining} left today on the ${PLANS[acct.plan].name} plan.`);
  return acct;
}

export async function recordUsage(userId: string, kind: string, model: string, credits: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("usage_events").insert({ user_id: userId, kind, model, credits });
  if (error) throw new Error("The request completed, but usage could not be recorded. Please contact the workspace owner before retrying.");
}

export function friendly(err: unknown): Error {
  const e = err as { name?: string; message?: string; httpStatus?: number };
  if (e?.name === "RateLimitError" || e?.httpStatus === 429) return new Error("The AI provider is busy right now. Please try again shortly.");
  if (e?.name === "PaymentRequiredError" || e?.httpStatus === 402)
    return new Error("The AI service has run out of credits. The site owner needs to top up AI balance in Lovable (Settings → Cloud & AI balance).");
  if (e?.name === "PermissionDeniedError") return new Error("This model isn't available for this workspace right now.");
  if (e?.message && !e?.httpStatus) return new Error(e.message);
  return new Error("The AI provider returned an error. Please retry.");
}

export type Turn = { role: "user" | "assistant"; content: string };

export async function callModel(model: string, mode: Mode, history: Turn[]): Promise<string> {
  const gw = await import("@lovable.dev/ai-gateway");
  if (model === "anthropic/claude-sonnet-5") {
    const res: any = await gw.generateMessage({
      model: "anthropic/claude-sonnet-5",
      max_tokens: 4096,
      system: SYSTEM[mode],
      messages: history.map((t) => ({ role: t.role, content: t.content })),
    } as any);
    return ((res?.content ?? []) as any[]).filter((b) => b?.type === "text").map((b) => b.text).join("\n");
  }
  const messages = [{ role: "system" as const, content: SYSTEM[mode] }, ...history];
  let res: any;
  if (model === "google/gemini-3.8-flash") {
    res = await gw.generateChatCompletion({
      model: "google/gemini-3.8-flash",
      messages,
      ...(mode === "research" ? { tools: [{ type: "google_search" }] } : {}),
    } as any);
  } else if (model === "openai/gpt-6-astra") {
    res = await gw.generateChatCompletion({ model: "openai/gpt-6-astra", messages } as any);
  } else if (model === "openai/gpt-5.4-mini") {
    res = await gw.generateChatCompletion({ model: "openai/gpt-5.4-mini", messages } as any);
  } else {
    throw new Error("Unknown model.");
  }
  const content = res?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : Array.isArray(content) ? content.map((c: any) => c?.text ?? "").join("") : "";
}

export const providerOf = (_model: string) => "Xenix";

export const sendChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        conversationId: z.string().uuid().nullable(),
        mode: z.enum(["chat", "code", "research"]),
        model: z.string().max(80),
        prompt: z.string().trim().min(1).max(8000).nullable(),
        regenerate: z.boolean().default(false),
        ephemeral: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const mode = data.mode as Mode;
    if (!getModel(data.model)) throw new Error("Unknown model.");
    const cost = chatCost(data.model, mode);
    const acct = await guard(ctx, cost);
    if (!canUseModel(acct.plan, data.model)) throw new Error(`${getModel(data.model)?.label} requires the Pro plan.`);
    const model = resolveForPlan(data.model, mode, acct.plan);

    let history: Turn[] = [];
    let conversationId = data.conversationId;

    if (data.ephemeral) {
      if (!data.prompt) throw new Error("Prompt is required.");
      history = [{ role: "user", content: data.prompt }];
    } else {
      if (!conversationId) {
        if (!data.prompt) throw new Error("Prompt is required.");
        const { data: conv, error } = await ctx.supabase
          .from("conversations")
          .insert({ user_id: ctx.userId, title: data.prompt.slice(0, 60), mode, model: data.model })
          .select("id")
          .single();
        if (error) throw new Error("Could not create conversation.");
        conversationId = conv.id as string;
      }
      if (data.regenerate) {
        const { data: last } = await ctx.supabase
          .from("messages")
          .select("id,role")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (last?.[0]?.role === "assistant") await ctx.supabase.from("messages").delete().eq("id", last[0].id);
      } else if (data.prompt) {
        const { error } = await ctx.supabase
          .from("messages")
          .insert({ conversation_id: conversationId, user_id: ctx.userId, role: "user", content: data.prompt });
        if (error) throw new Error("Could not save your message.");
      }
      const { data: rows } = await ctx.supabase
        .from("messages")
        .select("role,content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(20);
      history = ((rows ?? []) as Turn[]).reverse();
    }

    let text: string;
    try {
      text = await callModel(model, mode, history);
    } catch (err) {
      throw friendly(err);
    }
    if (!text.trim()) throw new Error("The model returned an empty response. Please retry.");

    await recordUsage(ctx.userId, mode, model, cost);
    let messageId: string | null = null;
    if (!data.ephemeral && conversationId) {
      const { data: msg } = await ctx.supabase
        .from("messages")
        .insert({ conversation_id: conversationId, user_id: ctx.userId, role: "assistant", content: text, model, provider: providerOf(model) })
        .select("id")
        .single();
      messageId = msg?.id ?? null;
      await ctx.supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    }
    return { conversationId, messageId, content: text, model, provider: providerOf(model), credits: cost };
  });

export const getUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const acct = await loadAccount(ctx);
    const { data: events } = await ctx.supabase
      .from("usage_events")
      .select("id,kind,model,credits,created_at")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(25);
    const limit = PLANS[acct.plan].dailyCredits;
    return {
      plan: acct.plan,
      limit,
      used: acct.used,
      remaining: Math.max(0, limit - acct.used),
      events: (events ?? []) as { id: string; kind: string; model: string; credits: number; created_at: string }[],
    };
  });

const SIZES: Record<AspectRatio, string> = {
  "1:1": "1024x1024",
  "16:9": "1536x864",
  "9:16": "864x1536",
  "4:3": "1280x960",
  "3:2": "1536x1024",
  "2:3": "1024x1536",
};

export const generateImageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        prompt: z.string().trim().min(3).max(2000),
        style: z.string().max(40),
        aspect: z.enum(ASPECT_RATIOS),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const cost = IMAGE_COST;
    await guard(ctx, cost);
    const prompt = data.style && data.style !== "None" ? `${data.prompt}. Style: ${data.style}.` : data.prompt;
    let b64: string | undefined;
    try {
      const gw = await import("@lovable.dev/ai-gateway");
      const res: any = await gw.generateImage({ model: IMAGE_MODEL, prompt, size: SIZES[data.aspect as AspectRatio], n: 1 } as any);
      b64 = res?.data?.[0]?.b64_json;
      if (!b64 && res?.data?.[0]?.url) {
        const r = await fetch(res.data[0].url);
        b64 = Buffer.from(await r.arrayBuffer()).toString("base64");
      }
    } catch (err) {
      throw friendly(err);
    }
    if (!b64) throw new Error("No image was returned. Please retry.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = crypto.randomUUID();
    const path = `${ctx.userId}/${id}.png`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("generations")
      .upload(path, Buffer.from(b64, "base64"), { contentType: "image/png" });
    if (upErr) throw new Error("Could not store the generated image.");
    const { error: saveError } = await supabaseAdmin
      .from("generations")
      .insert({ id, user_id: ctx.userId, prompt: data.prompt, style: data.style, aspect: data.aspect, model: IMAGE_MODEL, image_url: path });
    if (saveError) throw new Error("The image was generated, but could not be added to your gallery. Do not retry automatically.");
    await recordUsage(ctx.userId, "image", IMAGE_MODEL, cost);
    const { data: signed, error: signError } = await supabaseAdmin.storage.from("generations").createSignedUrl(path, 3600);
    if (signError || !signed?.signedUrl) throw new Error("Your image was saved, but could not be opened. Reopen the gallery rather than generating again.");
    return { id, url: signed?.signedUrl ?? "", prompt: data.prompt, credits: cost };
  });

export const listGenerations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const { data: rows } = await ctx.supabase
      .from("generations")
      .select("id,prompt,style,aspect,image_url,kind,duration,created_at")
      .order("created_at", { ascending: false })
      .limit(40);
    const list = (rows ?? []) as { id: string; prompt: string; style: string | null; aspect: string | null; image_url: string; kind: string; duration: number | null; created_at: string }[];
    if (!list.length) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Paths come from rows already filtered to the caller by RLS.
    const { data: signed } = await supabaseAdmin.storage.from("generations").createSignedUrls(list.map((r) => r.image_url), 3600);
    return list.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl ?? "" }));
  });
