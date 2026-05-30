import { createRemoteJWKSet, jwtVerify } from "jose";
import { AppError } from "@conversational-ai/shared";
import { jwtPayloadSchema, type JwtPayload } from "./schemas/jwt-payload.js";

export interface VerifyJwtOptions {
  token: string;
  issuer: string;
  audience?: string;
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(issuer: string) {
  const jwksUri = `${issuer.replace(/\/$/, "")}/.well-known/jwks.json`;
  let jwks = jwksCache.get(jwksUri);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(jwksUri));
    jwksCache.set(jwksUri, jwks);
  }
  return jwks;
}

export async function verifyJwt(options: VerifyJwtOptions): Promise<JwtPayload> {
  const { token, issuer, audience } = options;
  try {
    const { payload } = await jwtVerify(token, getJwks(issuer), {
      issuer,
      ...(audience ? { audience } : {}),
    });
    const parsed = jwtPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppError("INVALID_TOKEN", "JWT payload validation failed", {
        statusCode: 401,
      });
    }
    return parsed.data;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError("UNAUTHORIZED", "Invalid or expired token", {
      statusCode: 401,
      cause: err,
    });
  }
}
