import { meResponseSchema, type MeResponse } from "@conversational-ai/shared";
import type { AuthContext } from "../lib/jwt-context.js";

export function getMeProfile(auth: AuthContext): MeResponse {
  return meResponseSchema.parse({
    sub: auth.sub,
    email: auth.email,
    tenantId: auth.tenantId,
  });
}
