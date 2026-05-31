import { AppError } from "@conversational-ai/shared";
import type { APIGatewayProxyResultV2 } from "aws-lambda";

export function jsonResponse(
  statusCode: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "content-type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  };
}

export function errorResponse(err: unknown): APIGatewayProxyResultV2 {
  if (err instanceof AppError) {
    const statusCode = err.options?.statusCode ?? 400;
    return jsonResponse(statusCode, { code: err.code, message: err.message });
  }
  return jsonResponse(500, { code: "INTERNAL_ERROR", message: "An unexpected error occurred" });
}
