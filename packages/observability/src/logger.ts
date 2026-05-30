import pino, { type Logger as PinoLogger } from "pino";

export interface LogContext {
  service: string;
  correlationId: string;
  tenantId?: string;
  sessionId?: string;
}

export type Logger = PinoLogger;

export function createLogger(context: LogContext): Logger {
  const isDev = process.env.NODE_ENV === "development";
  return pino({
    level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
    base: {
      service: context.service,
      correlationId: context.correlationId,
      ...(context.tenantId ? { tenantId: context.tenantId } : {}),
      ...(context.sessionId ? { sessionId: context.sessionId } : {}),
    },
    ...(isDev
      ? {
          transport: {
            target: "pino/file",
            options: { destination: 1 },
          },
        }
      : {}),
  });
}
