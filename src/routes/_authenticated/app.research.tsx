import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ChatWorkspace } from "@/components/workspace/ChatWorkspace";
import { workspaceHead } from "@/lib/workspace";
export const Route = createFileRoute("/_authenticated/app/research")({
  validateSearch: z.object({ conversation: z.string().uuid().optional() }),
  head: () => workspaceHead("Research", "Explore questions with search-enabled Gemini in Xenix AI."),
  component: ResearchPage,
});
function ResearchPage() { const { conversation } = Route.useSearch(); return <ChatWorkspace mode="research" conversation={conversation} />; }
