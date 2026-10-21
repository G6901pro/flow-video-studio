import { describe, expect, it } from "vitest";
import { PLANS, chatCost, quotaCheck, canUseModel, resolveForPlan, IMAGE_COST, VIDEO_COST, clampVideoSeconds, VIDEO_MAX_SECONDS, IMAGE_MODEL, VIDEO_MODEL, ASPECT_RATIOS } from "@/lib/catalog";

describe("plans and credits", () => {
  it("free plan is $0 with 40 daily credits", () => {
    expect(PLANS.free.priceLabel).toBe("$0");
    expect(PLANS.free.dailyCredits).toBe(40);
  });
  it("pro plan gets 150 daily credits", () => {
    expect(PLANS.pro.dailyCredits).toBe(150);
  });
  it("image costs 5 and video costs 15", () => {
    expect(IMAGE_COST).toBe(5);
    expect(VIDEO_COST).toBe(15);
  });
  it("videos are capped at 10 seconds", () => {
    expect(clampVideoSeconds(30)).toBe(10);
    expect(VIDEO_MAX_SECONDS).toBe(10);
  });
  it("free users can use image and video studio", () => {
    expect(canUseModel("free", IMAGE_MODEL)).toBe(true);
    expect(canUseModel("free", VIDEO_MODEL)).toBe(true);
  });
  it("offers all six aspect ratios", () => {
    expect([...ASPECT_RATIOS]).toEqual(["1:1", "16:9", "9:16", "4:3", "3:2", "2:3"]);
  });
  it("pro plan is $20", () => {
    expect(PLANS.pro.priceLabel).toBe("$20");
  });
  it("research adds a surcharge", () => {
    expect(chatCost("google/gemini-3.8-flash", "research")).toBe(3);
    expect(chatCost("google/gemini-3.8-flash", "chat")).toBe(1);
  });
  it("blocks requests that exceed the daily limit", () => {
    expect(quotaCheck(39, 4, "free").allowed).toBe(false);
    expect(quotaCheck(36, 4, "free").allowed).toBe(true);
  });
  it("free plan cannot pick premium models", () => {
    expect(canUseModel("free", "anthropic/claude-sonnet-5")).toBe(false);
    expect(canUseModel("pro", "anthropic/claude-sonnet-5")).toBe(true);
  });
  it("auto on free never routes to premium", () => {
    expect(resolveForPlan("auto", "code", "free")).toBe("google/gemini-3.8-flash");
    expect(resolveForPlan("auto", "code", "pro")).toBe("anthropic/claude-sonnet-5");
  });
});
