import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { withCorrelation, initOtel } from "@conversational-ai/observability";
import { getAuthContext } from "../lib/jwt-context.js";
import { errorResponse, jsonResponse } from "../lib/http-response.js";
import { getMeProfile } from "../services/meService.js";

initOtel("conversational-ai-api");

export const handler = withCorrelation(
  "conversational-ai-api",
  async (event, _context, { logger }): Promise<APIGatewayProxyResultV2> => {
    try {
      const auth = getAuthContext(event);
      const profile = getMeProfile(auth);
      logger.info({ sub: auth.sub, tenantId: auth.tenantId }, "me.ok");
      return jsonResponse(200, profile);
    } catch (err) {
      logger.warn({ err }, "me.failed");
      return errorResponse(err);
    }
  },
);
