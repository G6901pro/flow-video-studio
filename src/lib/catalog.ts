// Single source of truth for plans, models and credit rules.
// Shared by UI and server; the server is the only place credits are enforced.

export type PlanId = "free" | "pro" | "enterprise";
export type Mode = "chat" | "code" | "research";
export type Category = "Chat" | "Writing" | "Coding" | "Research" | "Image Generation" | "Video Generation";

export interface Plan {
  id: PlanId;
  name: string;
  priceLabel: string;
  dailyCredits: number;
  blurb: string;
  features: string[];
  models: "basic" | "all";
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    dailyCredits: 40,
    blurb: "Explore the workspace with 40 fresh credits every day.",
    models: "basic",
    features: [
      "40 credits every day (daily refill)",
      "Xenix Auto, GPT-5.4 mini and Gemini Flash",
      "Chat, Code Studio and Research",
      "Image & video studio",
      "Conversation history",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLabel: "$20",
    dailyCredits: 150,
    blurb: "150 daily credits and priority generation.",
    models: "all",
    features: [
      "150 credits every day (daily refill)",
      "Priority generation",
      "Most capable assistant for every task",
      "Usage dashboard and limit alerts",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Custom",
    dailyCredits: 1000,
    blurb: "Team workflows with configurable limits.",
    models: "all",
    features: [
      "Configurable credit pools",
      "Team administration (planned)",
      "All connected models",
      "Custom usage terms",
    ],
  },
};

export interface ModelInfo {
  id: string; // gateway identifier, or "auto"
  label: string;
  provider: "Xenix" | "OpenAI" | "Anthropic" | "Google";
  kind: "chat" | "image" | "video";
  categories: Category[];
  credits: number;
  tier: "basic" | "premium";
  available: boolean;
  description: string;
}

export const MODELS: ModelInfo[] = [
  {
    id: "auto",
    label: "Xenix Auto",
    provider: "Xenix",
    kind: "chat",
    categories: ["Chat", "Writing", "Coding", "Research"],
    credits: 1,
    tier: "basic",
    available: true,
    description: "Routes each request to a suitable model for the task.",
  },
  {
    id: "openai/gpt-6-astra",
    label: "GPT-6 Astra",
    provider: "OpenAI",
    kind: "chat",
    categories: ["Chat", "Writing", "Coding"],
    credits: 4,
    tier: "premium",
    available: true,
    description: "OpenAI's flagship reasoning model for complex tasks.",
  },
  {
    id: "openai/gpt-5.4-mini",
    label: "GPT-5.4 mini",
    provider: "OpenAI",
    kind: "chat",
    categories: ["Chat", "Writing"],
    credits: 1,
    tier: "basic",
    available: true,
    description: "Fast, efficient everyday assistant.",
  },
  {
    id: "anthropic/claude-sonnet-5",
    label: "Claude Sonnet 5",
    provider: "Anthropic",
    kind: "chat",
    categories: ["Chat", "Writing", "Coding"],
    credits: 4,
    tier: "premium",
    available: true,
    description: "Strong long-form writing and careful code generation.",
  },
  {
    id: "google/gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    provider: "Google",
    kind: "chat",
    categories: ["Chat", "Research", "Coding"],
    credits: 1,
    tier: "basic",
    available: true,
    description: "Quick multimodal model with Google Search grounding.",
  },
  {
    id: "openai/gpt-image-2.5-sunburst",
    label: "GPT Image 2.5",
    provider: "OpenAI",
    kind: "image",
    categories: ["Image Generation"],
    credits: 5,
    tier: "basic",
    available: true,
    description: "High-quality image generation from text prompts.",
  },
  {
    id: "google/gemini-omni-1.1-flash",
    label: "Video generation",
    provider: "Google",
    kind: "video",
    categories: ["Video Generation"],
    credits: 15,
    tier: "basic",
    available: true,
    description: "Short AI video clips (up to 10 seconds) from text prompts.",
  },
];

export const CHAT_MODELS = MODELS.filter((m) => m.kind === "chat");

/** Task-based routing used by Xenix Auto. */
export const AUTO_ROUTES: Record<Mode, string> = {
  chat: "google/gemini-3.8-flash",
  code: "anthropic/claude-sonnet-5",
  research: "google/gemini-3.8-flash",
};

export const RESEARCH_SURCHARGE = 2;
export const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";
export const VIDEO_MODEL = "google/gemini-omni-1.1-flash";
export const IMAGE_COST = 5;
export const VIDEO_COST = 15;
export const VIDEO_MAX_SECONDS = 10;
export const VIDEO_MIN_SECONDS = 3;
export const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:2", "2:3"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];
/** Video supports only landscape or portrait output; map other ratios to the nearest. */
export function videoAspect(a: AspectRatio): "16:9" | "9:16" {
  return a === "9:16" || a === "2:3" ? "9:16" : "16:9";
}
export const ASSISTANT_NAME = "Your AI Assistant";
export const RATE_LIMIT_PER_MINUTE = 12;
export const LOW_BALANCE_RATIO = 0.8;

export function getModel(id: string): ModelInfo | undefined {
  return MODELS.find((m) => m.id === id);
}

export function resolveModel(id: string, mode: Mode): string {
  return id === "auto" ? AUTO_ROUTES[mode] : id;
}

/** Credits charged for one chat request. Auto is charged at the routed model's rate. */
export function chatCost(modelId: string, mode: Mode): number {
  const resolved = getModel(resolveModel(modelId, mode));
  const base = resolved?.credits ?? 1;
  return mode === "research" ? base + RESEARCH_SURCHARGE : base;
}

export function canUseModel(plan: PlanId, modelId: string): boolean {
  const m = getModel(modelId);
  if (!m || !m.available) return false;
  if (modelId === "auto") return true;
  return PLANS[plan].models === "all" || m.tier === "basic";
}

/** Free plan Auto never routes to premium models. */
export function resolveForPlan(modelId: string, mode: Mode, plan: PlanId): string {
  const resolved = resolveModel(modelId, mode);
  if (modelId === "auto" && PLANS[plan].models === "basic" && getModel(resolved)?.tier === "premium") {
    return "google/gemini-3.8-flash";
  }
  return resolved;
}

export function quotaCheck(used: number, cost: number, plan: PlanId) {
  const limit = PLANS[plan].dailyCredits;
  return { allowed: used + cost <= limit, limit, remaining: Math.max(0, limit - used) };
}

/** Start of the current daily credit window (midnight UTC). */
export function dayStart(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

export function clampVideoSeconds(s: number): number {
  return Math.min(VIDEO_MAX_SECONDS, Math.max(VIDEO_MIN_SECONDS, Math.round(s)));
}
