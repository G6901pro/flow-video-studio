import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
  it.each(["/app", "/app/code", "/app/research", "/app/images", "/app/history", "/app/usage", "/app/billing", "/app/settings"])("keeps %s beneath the signed-in gate", (path) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes(path);
    expect(matches.map((m) => m.routeId)).toContain("/_authenticated");
    expect(matches.at(-1)?.routeId).not.toBe("/_authenticated/app");
  });
});
