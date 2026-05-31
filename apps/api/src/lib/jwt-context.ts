import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { jwtPayloadSchema, type JwtPayload } from "@conversational-ai/auth";
import { AppError } from "@conversational-ai/shared";

type JwtAuthorizerContext = {
  jwt?: { claims?: Record<string, string> };
};

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

  const claims: JwtPayload = jwtPayloadSchema.parse(raw);
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
