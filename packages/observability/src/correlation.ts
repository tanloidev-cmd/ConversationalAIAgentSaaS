import { randomUUID } from "node:crypto";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

export const CORRELATION_HEADER = "x-correlation-id";

export function getCorrelationId(event: APIGatewayProxyEventV2): string {
  const headers = event.headers ?? {};
  const fromHeader =
    headers[CORRELATION_HEADER] ??
    headers[CORRELATION_HEADER.toUpperCase()] ??
    headers["X-Correlation-Id"];
  if (fromHeader && fromHeader.trim().length > 0) {
    return fromHeader.trim();
  }
  return randomUUID();
}
