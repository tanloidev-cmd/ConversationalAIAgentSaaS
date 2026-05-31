import type { z, ZodTypeAny } from "zod";

export type ToolContext = {
  tenantId: string;
  userId: string;
  sessionId: string;
  idempotencyKey?: string;
};

export type ToolAuditEntry = {
  tenantId: string;
  userId: string;
  sessionId: string;
  toolName: string;
  argsHash: string;
  status: "success" | "error";
  durationMs: number;
  idempotencyKey?: string;
};

export type ToolDefinition<
  TInput extends ZodTypeAny = ZodTypeAny,
  TOutput extends ZodTypeAny = ZodTypeAny,
> = {
  name: string;
  description: string;
  inputSchema: TInput;
  outputSchema: TOutput;
  permissions: string[];
  timeoutMs: number;
  execute: (input: z.infer<TInput>, ctx: ToolContext) => Promise<z.infer<TOutput>>;
};

export type ToolErrorCode =
  | "VALIDATION_ERROR"
  | "PERMISSION_DENIED"
  | "TIMEOUT"
  | "EXECUTION_ERROR";

export class ToolError extends Error {
  constructor(
    public readonly code: ToolErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ToolError";
  }
}
