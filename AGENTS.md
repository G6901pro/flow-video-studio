<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the signed-in workspace shell in the `/app` layout and individual tools in child routes so navigation and account state stay consistent.
- Use the shared model catalog for displayed plans and request costs; enforce entitlements and credits only in authenticated server functions.
- Store workspace records through the generated client with owner-scoped access; use authenticated server functions for AI inference and privileged usage writes.
- Use `workspaceHead` for unique workspace and recovery metadata so each content route has complete sharing tags.
- Chat replies stream from the authenticated `/api/chat` server route (bearer token checked in the handler); keep model names out of the chat UI.
- Credits refill daily (UTC); plan allowances and per-item costs live only in `src/lib/catalog.ts`.
- Video jobs are created and polled through server functions, stored in the private `generations` bucket, and charged only once the video is saved.
- Google sign-in always goes through `lovable.auth.signInWithOAuth("google")` with `redirect_uri: ${origin}/auth` and `prompt: "select_account"` so the account chooser opens; the `/auth` page listens for the session (getSession + SIGNED_IN) and navigates to `/app` — never redirect OAuth users to the homepage.
