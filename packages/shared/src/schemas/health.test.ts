import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "./health.js";

describe("healthResponseSchema", () => {
  it("parses valid health response", () => {
    const result = healthResponseSchema.safeParse({
      status: "ok",
      version: "0.1.0",
      environment: "dev",
      timestamp: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = healthResponseSchema.safeParse({
      status: "degraded",
      version: "0.1.0",
      environment: "dev",
      timestamp: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
