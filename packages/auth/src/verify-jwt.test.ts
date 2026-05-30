import { describe, expect, it } from "vitest";
import { jwtPayloadSchema } from "./schemas/jwt-payload.js";

describe("jwtPayloadSchema", () => {
  it("parses cognito-like payload", () => {
    const result = jwtPayloadSchema.safeParse({
      sub: "user-123",
      email: "user@example.com",
      "custom:tenantId": "tenant-1",
    });
    expect(result.success).toBe(true);
  });
});
