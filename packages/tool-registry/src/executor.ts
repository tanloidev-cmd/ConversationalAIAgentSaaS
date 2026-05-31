import { createHash } from "node:crypto";
import type { ToolAuditEntry, ToolContext } from "./types.js";
import { ToolError } from "./types.js";
import type { ToolRegistry } from "./registry.js";

export type ExecuteToolOptions = {
  maxAttempts?: number;
  auditLog?: (entry: ToolAuditEntry) => void;
};

const idempotencyCache = new Map<string, unknown>();

function hashArgs(name: string, args: unknown): string {
  return createHash("sha256")
    .update(`${name}:${JSON.stringify(args)}`)
    .digest("hex")
    .slice(0, 16);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeTool(
  registry: ToolRegistry,
  toolName: string,
  rawInput: unknown,
  ctx: ToolContext,
  options: ExecuteToolOptions = {},
): Promise<unknown> {
  const tool = registry.get(toolName);
  if (!tool) {
    throw new ToolError("VALIDATION_ERROR", `Unknown tool: ${toolName}`);
  }

  if (!tool.permissions.every((p) => isToolAllowedForTenant(ctx.tenantId, p))) {
    throw new ToolError("PERMISSION_DENIED", `Tool not allowed: ${toolName}`);
  }

  const parsed = tool.inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ToolError("VALIDATION_ERROR", parsed.error.message);
  }

  const cacheKey = ctx.idempotencyKey && `${ctx.tenantId}:${toolName}:${ctx.idempotencyKey}`;
  if (cacheKey && idempotencyCache.has(cacheKey)) {
    return idempotencyCache.get(cacheKey);
  }

  const maxAttempts = options.maxAttempts ?? 3;
  const argsHash = hashArgs(toolName, parsed.data);
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const started = Date.now();
    try {
      const result = await runWithTimeout(tool.execute(parsed.data, ctx), tool.timeoutMs);
      const validated = tool.outputSchema.parse(result);
      options.auditLog?.({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        sessionId: ctx.sessionId,
        toolName,
        argsHash,
        status: "success",
        durationMs: Date.now() - started,
        idempotencyKey: ctx.idempotencyKey,
      });
      if (cacheKey) {
        idempotencyCache.set(cacheKey, validated);
      }
      return validated;
    } catch (err) {
      lastError = err;
      options.auditLog?.({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        sessionId: ctx.sessionId,
        toolName,
        argsHash,
        status: "error",
        durationMs: Date.now() - started,
        idempotencyKey: ctx.idempotencyKey,
      });
      if (attempt < maxAttempts) {
        await sleep(Math.min(1000 * 2 ** (attempt - 1), 8000));
        continue;
      }
    }
  }

  if (lastError instanceof ToolError) {
    throw lastError;
  }
  throw new ToolError(
    "EXECUTION_ERROR",
    lastError instanceof Error ? lastError.message : "Tool execution failed",
  );
}

async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new ToolError("TIMEOUT", "Tool execution timed out")),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Phase 4: replace with DB-backed tenant tool permissions */
function isToolAllowedForTenant(_tenantId: string, _permission: string): boolean {
  void _tenantId;
  void _permission;
  return true;
}
