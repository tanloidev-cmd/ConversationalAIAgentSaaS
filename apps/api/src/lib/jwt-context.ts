import { z } from "zod";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { AppError } from "@conversational-ai/shared";

type JwtAuthorizerContext = {
  jwt?: { claims?: Record<string, unknown> };
};

const authClaimsSchema = z
  .object({
    sub: z.string(),
    email: z.string().optional(),
    "custom:tenantId": z.string().optional(),
  })
  .passthrough();

export type AuthContext = {
  sub: string;
  email?: string;
  tenantId: string;
  userId: string;
};

export function getAuthContext(event: APIGatewayProxyEventV2): AuthContext {
  const authorizer = event.requestContext as typeof event.requestContext & JwtAuthorizerContext;
  const raw = authorizer.jwt?.claims;
  if (!raw?.sub) {
    throw new AppError("UNAUTHORIZED", "Missing JWT claims", { statusCode: 401 });
  }

  const parsed = authClaimsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError("INVALID_TOKEN", "Invalid JWT claims", {
      statusCode: 401,
      cause: parsed.error,
    });
  }

  const claims = parsed.data;
  const tenantId = claims["custom:tenantId"];
  if (!tenantId) {
    throw new AppError("TENANT_REQUIRED", "Tenant claim is required", { statusCode: 403 });
  }

  return {
    sub: claims.sub,
    email: claims.email,
    tenantId,
    userId: claims.sub,
  };
}
