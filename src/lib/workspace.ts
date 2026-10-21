import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const conversationsOptions = queryOptions({
  queryKey: ["conversations"],
  queryFn: async () => {
    const { data, error } = await supabase.from("conversations").select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false });
    if (error) throw new Error("Could not load conversations.");
    return data;
  },
});

export const profileOptions = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Please sign in again.");
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) throw new Error("Could not load your profile.");
    return { profile: data, user };
  },
});

export const messagesOptions = (id: string | undefined) => queryOptions({
  queryKey: ["messages", id],
  enabled: Boolean(id),
  queryFn: async () => {
    if (!id) return [];
    const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
    if (error) throw new Error("Could not load messages.");
    return data;
  },
});

export function workspaceHead(title: string, description: string) {
  return { meta: [{ title: `${title} — Xenix AI` }, { name: "description", content: description }, { property: "og:title", content: `${title} — Xenix AI` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}