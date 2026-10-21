import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { chatCost, getModel, resolveForPlan, type Mode } from "@/lib/catalog";

const Body = z.object({
  conversationId: z.string().uuid().nullable(),
  mode: z.enum(["chat", "code", "research"]),
  prompt: z.string().trim().min(1).max(8000).nullable(),
  regenerate: z.boolean().default(false),
});

type Turn = { role: "user" | "assistant"; content: string };

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

/** Streams assistant text as plain UTF-8 chunks. Conversation id is returned in the X-Conversation-Id header. */
export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = process.env['SUPABASE_URL'];
        const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
        if (!url || !key) return jsonError(500, "The workspace backend is not configured.");
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token || token.split(".").length !== 3) return jsonError(401, "Please sign in again.");
        const supabase = createClient<Database>(url, key, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
        });
        const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (authErr || !userId) return jsonError(401, "Please sign in again.");

        let data: z.infer<typeof Body>;
        try {
          data = Body.parse(await request.json());
        } catch {
          return jsonError(400, "Invalid request.");
        }
        const mode = data.mode as Mode;
        const { guard, recordUsage, friendly, SYSTEM, providerOf } = await import("@/lib/ai.functions");
        const ctx = { supabase, userId };

        let acct;
        const cost = chatCost("auto", mode);
        try {
          acct = await guard(ctx, cost);
        } catch (e) {
          return jsonError(402, e instanceof Error ? e.message : "Not enough credits.");
        }
        const model = resolveForPlan("auto", mode, acct.plan);
        if (!getModel(model)) return jsonError(400, "Assistant unavailable.");

        let conversationId = data.conversationId;
        if (!conversationId) {
          if (!data.prompt) return jsonError(400, "Prompt is required.");
          const { data: conv, error } = await supabase
            .from("conversations")
            .insert({ user_id: userId, title: data.prompt.slice(0, 60), mode, model: "auto" })
            .select("id")
            .single();
          if (error || !conv) return jsonError(500, "Could not create conversation.");
          conversationId = conv.id;
        }
        if (data.regenerate) {
          const { data: last } = await supabase
            .from("messages")
            .select("id,role")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: false })
            .limit(1);
          if (last?.[0]?.role === "assistant") await supabase.from("messages").delete().eq("id", last[0].id);
        } else if (data.prompt) {
          const { error } = await supabase
            .from("messages")
            .insert({ conversation_id: conversationId, user_id: userId, role: "user", content: data.prompt });
          if (error) return jsonError(500, "Could not save your message.");
        }
        const { data: rows } = await supabase
          .from("messages")
          .select("role,content")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .limit(20);
        const history = ((rows ?? []) as Turn[]).reverse();

        const gw = await import("@lovable.dev/ai-gateway");
        let events: AsyncIterable<any>;
        try {
          if (model.startsWith("anthropic/")) {
            events = (await gw.streamMessage({
              model: model as "anthropic/claude-sonnet-5",
              max_tokens: 4096,
              system: SYSTEM[mode],
              messages: history,
            } as any)) as any;
          } else {
            events = (await gw.streamChatCompletion({
              model: model as any,
              messages: [{ role: "system", content: SYSTEM[mode] }, ...history],
              ...(mode === "research" && model.startsWith("google/") ? { tools: [{ type: "google_search" }] } : {}),
            } as any)) as any;
          }
        } catch (err) {
          return jsonError(502, friendly(err).message);
        }

        const encoder = new TextEncoder();
        const convId = conversationId;
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            let text = "";
            try {
              for await (const ev of events) {
                const piece: string | undefined =
                  ev?.choices?.[0]?.delta?.content ??
                  (ev?.type === "content_block_delta" && ev?.delta?.type === "text_delta" ? ev.delta.text : undefined);
                if (typeof piece === "string" && piece) {
                  text += piece;
                  controller.enqueue(encoder.encode(piece));
                }
              }
              if (!text.trim()) throw new Error("The assistant returned an empty response. Please retry.");
              await supabase.from("messages").insert({
                conversation_id: convId,
                user_id: userId,
                role: "assistant",
                content: text,
                model,
                provider: providerOf(model),
              });
              await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
              await recordUsage(userId, mode, model, cost);
            } catch (err) {
              controller.enqueue(encoder.encode(`\n\n[[error:${friendly(err).message}]]`));
            } finally {
              controller.close();
            }
          },
        });
        return new Response(stream, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-cache, no-transform",
            "x-conversation-id": convId,
          },
        });
      },
    },
  },
});
