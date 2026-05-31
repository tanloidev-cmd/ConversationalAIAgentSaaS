import { describe, expect, it, vi } from "vitest";
import { createDefaultRegistry, executeTool } from "./index.js";

describe("executeTool", () => {
  it("rejects malformed input", async () => {
    const registry = createDefaultRegistry();
    await expect(
      executeTool(
        registry,
        "echo",
        {},
        {
          tenantId: "t1",
          userId: "u1",
          sessionId: "s1",
        },
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("executes echo tool", async () => {
    const registry = createDefaultRegistry();
    const audit = vi.fn();
    const result = await executeTool(
      registry,
      "echo",
      { message: "hi" },
      { tenantId: "t1", userId: "u1", sessionId: "s1", idempotencyKey: "k1" },
      { auditLog: audit },
    );
    expect(result).toEqual({ echoed: "hi" });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ toolName: "echo", status: "success" }),
    );
  });
});
