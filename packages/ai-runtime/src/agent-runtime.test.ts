import { describe, expect, it, vi } from "vitest";
import { AgentRuntime } from "./agent-runtime.js";
import { BedrockClient } from "./bedrock-client.js";

describe("AgentRuntime", () => {
  it("returns assistant message from mock bedrock", async () => {
    const bedrock = new BedrockClient({
      config: {
        lightweightModelId: "amazon.nova-micro-v1:0",
        reasoningModelId: "anthropic.claude-3-5-haiku-20241022-v1:0",
      },
      mock: true,
    });
    const onAudit = vi.fn();
    const runtimeWithAudit = new AgentRuntime({ bedrock, onAudit });
    const result = await runtimeWithAudit.runTurn({
      tenantId: "t1",
      userId: "u1",
      sessionId: "s1",
      messages: [],
      userContent: "Hello there",
    });
    expect(result.assistantMessage).toContain("Hello");
  });
});
