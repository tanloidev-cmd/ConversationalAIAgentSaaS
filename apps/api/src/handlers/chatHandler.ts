import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { withCorrelation, initOtel } from "@conversational-ai/observability";
import { getAuthContext } from "../lib/jwt-context.js";
import { errorResponse, jsonResponse } from "../lib/http-response.js";
import { postMessage } from "../services/chatService.js";

initOtel("conversational-ai-api");

function parseSessionId(event: {
  pathParameters?: Record<string, string | undefined>;
  rawPath?: string;
}): string | null {
  if (event.pathParameters?.sessionId) {
    return event.pathParameters.sessionId;
  }
  const path = event.rawPath;
  if (!path) return null;
  const match = /^\/v1\/sessions\/([^/]+)\/messages$/.exec(path);
  return match?.[1] ?? null;
}

export const handler = withCorrelation(
  "conversational-ai-api",
  async (event, _context, { logger }): Promise<APIGatewayProxyResultV2> => {
    try {
      const auth = getAuthContext(event);
      const sessionId = parseSessionId(event);
      if (!sessionId || event.requestContext.http.method !== "POST") {
        return jsonResponse(404, { code: "NOT_FOUND", message: "Not found" });
      }

      const body = event.body ? JSON.parse(event.body) : {};
      const idempotencyKey = event.headers["idempotency-key"] ?? event.headers["Idempotency-Key"];
      const result = await postMessage(auth, sessionId, body, {
        idempotencyKey: idempotencyKey ?? undefined,
      });
      logger.info(
        { sessionId, tenantId: auth.tenantId, toolCount: result.toolCalls?.length ?? 0 },
        "chat.message",
      );
      return jsonResponse(200, result);
    } catch (err) {
      logger.warn({ err }, "chat.failed");
      return errorResponse(err);
    }
  },
);
