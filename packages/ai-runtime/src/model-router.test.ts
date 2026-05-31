import { describe, expect, it } from "vitest";
import { resolveModelId, selectModelTier } from "./model-router.js";

describe("selectModelTier", () => {
  const config = {
    lightweightModelId: "amazon.nova-micro-v1:0",
    reasoningModelId: "anthropic.claude-3-5-haiku-20241022-v1:0",
  };

  it("uses lightweight for short messages", () => {
    expect(selectModelTier({ content: "hello" })).toBe("lightweight");
    expect(resolveModelId("lightweight", config)).toBe(config.lightweightModelId);
  });

  it("uses reasoning when tools required", () => {
    expect(selectModelTier({ content: "hi", requiresTools: true })).toBe("reasoning");
  });
});
