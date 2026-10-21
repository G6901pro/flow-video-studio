# Xenix AI

One Workspace. Every Intelligence.

## Development

```sh
bun install
bun run dev
bun run test
bun run build
```

The application uses TanStack Start, React, TypeScript and Tailwind CSS. Lovable supplies the managed server environment; `.env.example` documents configuration for another host. Never put private credentials in `VITE_*` variables.

## Experiences

- Public pages: `/`, `/features`, `/models`, `/pricing`, `/faq`.
- Account access: `/auth`, `/forgot-password`, `/reset-password`.
- Signed-in workspace: `/app`, `/app/code`, `/app/research`, `/app/images`, `/app/history`, `/app/usage`, `/app/billing`, `/app/settings`.
- First-time accounts choose a primary goal. Conversations support search, pin, rename and deletion. Saved responses render Markdown and syntax-highlighted code with copy controls.
- Signed-out playground output is simulated and labeled. Signed-in requests use authenticated server functions and the Lovable AI Gateway.

## Configuration and limits

The shared catalog defines model identifiers, task routing, prices and credit estimates. Free is $0/month and Pro is $20/month. Credit allowances and request costs are provisional product settings, not provider token prices. Server functions check account plans, monthly usage and rate limits before inference. Monthly usage resets at UTC month start.

Google sign-in uses the Lovable broker; email signup requires confirmation. Configure production auth redirect URLs for the published origin and `/reset-password`. Do not disable confirmation to make tests pass. Account signup/sign-in and recovery delivery require hosted verification.

AI model availability is workspace-dependent. Research enables Gemini search, but source links supplied in model text are not independently verified citation metadata. Generated code is not executed. Stop stops waiting locally; remote inference may continue, be billed and save a result. Responses are currently non-streaming.

Image generation requires a premium account. Generated images are in private storage with temporary signed access links. Video generation is not enabled.

## Launch blockers

Stripe checkout and signed billing webhooks are not connected; plan-change controls are deliberately unavailable. Enable and verify payments before selling Pro. No payment success or premium entitlement is simulated. Confirm real credit allowances, request costs and Enterprise contact details before launch.

No signed-in account was available for end-to-end testing during workspace implementation. Test real chat, regeneration, history management, image generation on an entitled account, onboarding and password recovery before release. Ordinary UI checks and unit tests do not establish these hosted flows.
