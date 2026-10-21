import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
export const Route = createFileRoute("/_authenticated/app")({ component: () => <WorkspaceShell><Outlet /></WorkspaceShell> });