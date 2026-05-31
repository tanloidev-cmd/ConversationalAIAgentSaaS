import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { initOtel } from "@conversational-ai/observability";
import { encodeSseEvent } from "@conversational-ai/ai-runtime";
import { getAuthContext } from "../lib/jwt-context.js";
import { errorResponse } from "../lib/http-response.js";
import { postMessageStream } from "../services/chatService.js";

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
  const match = /^\/v1\/sessions\/([^/]+)\/messages\/stream$/.exec(path);
  return match?.[1] ?? null;
}

/** SSE chat — buffers full stream for API Gateway compatibility in Phase 2 MVP */
export async function handler(
  event: Parameters<typeof getAuthContext>[0] & { body?: string | null },
): Promise<APIGatewayProxyResultV2> {
  try {
    const auth = getAuthContext(event);
    const sessionId = parseSessionId(event);
    if (!sessionId) {
      return errorResponse({ code: "NOT_FOUND", message: "Not found" });
    }

    const chunks: string[] = [];
    const body = event.body ? JSON.parse(event.body) : {};
    await postMessageStream(auth, sessionId, body, {
      onEvent: (ev) => {
        chunks.push(encodeSseEvent(ev));
      },
    });

    return {
      statusCode: 200,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
      body: chunks.join(""),
    };
  } catch (err) {
    return errorResponse(err);
  }
}
