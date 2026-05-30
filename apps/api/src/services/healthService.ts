import type { HealthResponse } from "@conversational-ai/shared";

export function getHealth(): HealthResponse {
  return {
    status: "ok",
    version: process.env.APP_VERSION ?? "0.1.0",
    environment: process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
  };
}
