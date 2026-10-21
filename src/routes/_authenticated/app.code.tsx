import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ChatWorkspace } from "@/components/workspace/ChatWorkspace";
import { workspaceHead } from "@/lib/workspace";
export const Route = createFileRoute("/_authenticated/app/code")({
  validateSearch: z.object({ conversation: z.string().uuid().optional() }),
  head: () => workspaceHead("Code Studio", "Generate and understand code with Xenix AI."),
  component: CodePage,
});
function CodePage() { const { conversation } = Route.useSearch(); return <ChatWorkspace mode="code" conversation={conversation} />; }
