import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { withCorrelation, initOtel } from "@conversational-ai/observability";
import { getAuthContext } from "../lib/jwt-context.js";
import { errorResponse, jsonResponse } from "../lib/http-response.js";
import { createSession, getSessionDetail } from "../services/sessionService.js";

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
  const match = /^\/v1\/sessions\/([^/]+)$/.exec(path);
  return match?.[1] ?? null;
}

export const handler = withCorrelation(
  "conversational-ai-api",
  async (event, _context, { logger }): Promise<APIGatewayProxyResultV2> => {
    try {
      const auth = getAuthContext(event);
      const method = event.requestContext.http.method;
      const path = event.rawPath;

      if (method === "POST" && path === "/v1/sessions") {
        const body = event.body ? JSON.parse(event.body) : {};
        const session = await createSession(auth, body);
        logger.info({ sessionId: session.sessionId, tenantId: auth.tenantId }, "session.created");
        return jsonResponse(201, session);
      }

      if (method === "GET") {
        const sessionId = parseSessionId(event);
        if (!sessionId) {
          return jsonResponse(404, { code: "NOT_FOUND", message: "Not found" });
        }
        const detail = await getSessionDetail(auth, sessionId);
        logger.info({ sessionId, tenantId: auth.tenantId }, "session.fetched");
        return jsonResponse(200, detail);
      }

      return jsonResponse(405, { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" });
    } catch (err) {
      logger.warn({ err }, "sessions.failed");
      return errorResponse(err);
    }
  },
);
