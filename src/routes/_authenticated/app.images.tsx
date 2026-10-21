import { createFileRoute } from "@tanstack/react-router";
import { ImageWorkspace } from "@/components/workspace/ImageWorkspace";
import { workspaceHead } from "@/lib/workspace";
export const Route = createFileRoute("/_authenticated/app/images")({ head: () => workspaceHead("Image Studio", "Create images and browse your private Xenix AI gallery."), component: ImageWorkspace });
