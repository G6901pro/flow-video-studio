import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ChatWorkspace } from "@/components/workspace/ChatWorkspace";
import { workspaceHead } from "@/lib/workspace";
export const Route = createFileRoute("/_authenticated/app/")({
  validateSearch: z.object({ conversation: z.string().uuid().optional() }),
  head: () => workspaceHead("Chat", "Write, brainstorm and ask questions in your Xenix AI workspace."),
  component: ChatPage,
});
function ChatPage() { const { conversation } = Route.useSearch(); return <ChatWorkspace mode="chat" conversation={conversation} />; }
