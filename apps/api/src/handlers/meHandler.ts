import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { withCorrelation } from "@conversational-ai/observability";
import { initOtel } from "@conversational-ai/observability";

initOtel("conversational-ai-api");

type JwtAuthorizerContext = {
  jwt?: { claims?: Record<string, string> };
};

/** Placeholder route to verify JWT authorizer wiring — Phase 1 */
export const handler = withCorrelation(
  "conversational-ai-api",
  async (event, _context, { logger }): Promise<APIGatewayProxyResultV2> => {
    const authorizer = event.requestContext as typeof event.requestContext & JwtAuthorizerContext;
    const claims = authorizer.jwt?.claims;
    logger.info({ sub: claims?.sub }, "me.stub");
    return {
      statusCode: 501,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "NOT_IMPLEMENTED",
        message: "User profile endpoint is not implemented yet",
      }),
    };
  },
);
