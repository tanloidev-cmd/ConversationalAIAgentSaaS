import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { healthResponseSchema } from "@conversational-ai/shared";
import { withCorrelation } from "@conversational-ai/observability";
import { initOtel } from "@conversational-ai/observability";
import { getHealth } from "../services/healthService.js";

initOtel("conversational-ai-api");

export const handler = withCorrelation(
  "conversational-ai-api",
  async (_event, _context, { logger }): Promise<APIGatewayProxyResultV2> => {
    const health = getHealth();
    const body = healthResponseSchema.parse(health);
    logger.info({ message: "health.check" }, "health.ok");
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    };
  },
);

export async function handleHealthLocal(): Promise<APIGatewayProxyResultV2> {
  const mockEvent = {
    headers: {},
    requestContext: { requestId: "local" },
  } as APIGatewayProxyEventV2;
  return handler(mockEvent, { awsRequestId: "local" } as never);
}
