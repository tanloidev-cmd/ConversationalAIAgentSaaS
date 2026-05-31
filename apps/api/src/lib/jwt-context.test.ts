import { describe, expect, it } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { AppError } from "@conversational-ai/shared";
import { getAuthContext } from "./jwt-context.js";

describe("getAuthContext", () => {
  it("returns auth context when JWT claims include an invalid email string", () => {
    const event = {
      requestContext: {
        jwt: {
          claims: {
            sub: "user-123",
            email: "not-an-email",
            "custom:tenantId": "tenant-abc",
          },
        },
      },
    } as unknown as APIGatewayProxyEventV2;

    expect(getAuthContext(event)).toEqual({
      sub: "user-123",
      email: "not-an-email",
      tenantId: "tenant-abc",
      userId: "user-123",
    });
  });

  it("throws AppError when JWT claims are missing sub", () => {
    const event = {
      requestContext: {
        jwt: {
          claims: {
            "custom:tenantId": "tenant-abc",
          },
        },
      },
    } as unknown as APIGatewayProxyEventV2;

    expect(() => getAuthContext(event)).toThrow(AppError);
  });
});
