import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import { getCorrelationId } from "./correlation.js";
import { createLogger } from "./logger.js";

export type ApiGatewayHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyResultV2>;

export function withCorrelation(
  serviceName: string,
  handler: (
    event: APIGatewayProxyEventV2,
    context: Context,
    deps: { correlationId: string; logger: ReturnType<typeof createLogger> },
  ) => Promise<APIGatewayProxyResultV2>,
): ApiGatewayHandler {
  return async (event, context) => {
    const correlationId = getCorrelationId(event);
    const logger = createLogger({ service: serviceName, correlationId });
    logger.info({ requestId: context.awsRequestId, routeKey: event.routeKey }, "request.start");
    try {
      const result = await handler(event, context, { correlationId, logger });
      logger.info({ statusCode: getStatusCode(result) }, "request.end");
      return appendCorrelationHeader(result, correlationId);
    } catch (err) {
      logger.error({ err }, "request.error");
      throw err;
    }
  };
}

function getStatusCode(result: APIGatewayProxyResultV2): number | undefined {
  if (typeof result === "object" && result !== null && "statusCode" in result) {
    return result.statusCode as number;
  }
  return undefined;
}

function appendCorrelationHeader(
  result: APIGatewayProxyResultV2,
  correlationId: string,
): APIGatewayProxyResultV2 {
  if (typeof result !== "object" || result === null) {
    return result;
  }
  const headers = {
    ...(result.headers ?? {}),
    "x-correlation-id": correlationId,
  };
  return { ...result, headers };
}
