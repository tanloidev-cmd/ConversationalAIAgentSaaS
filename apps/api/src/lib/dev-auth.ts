import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { AuthContext } from "./jwt-context.js";

/** Local-only: inject JWT claims for dev server */
export function patchEventWithDevJwt(event: APIGatewayProxyEventV2): APIGatewayProxyEventV2 {
  if (process.env.DEV_AUTH_BYPASS !== "true") {
    return event;
  }
  const tenantId = process.env.DEV_TENANT_ID ?? "tenant-dev";
  const sub = process.env.DEV_USER_ID ?? "user-dev";
  return {
    ...event,
    requestContext: {
      ...event.requestContext,
      jwt: {
        claims: {
          sub,
          email: "dev@localhost",
          "custom:tenantId": tenantId,
        },
      },
    },
  } as APIGatewayProxyEventV2;
}

export function getDevAuthContext(): AuthContext {
  return {
    sub: process.env.DEV_USER_ID ?? "user-dev",
    email: "dev@localhost",
    tenantId: process.env.DEV_TENANT_ID ?? "tenant-dev",
    userId: process.env.DEV_USER_ID ?? "user-dev",
  };
}
