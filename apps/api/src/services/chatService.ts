import { postMessageRequestSchema, postMessageResponseSchema } from "@conversational-ai/shared";
import type { z } from "zod";

type PostMessageResponse = z.infer<typeof postMessageResponseSchema>;
import { AppError } from "@conversational-ai/shared";
import { AgentRuntime, BedrockClient, createAgentRuntime } from "@conversational-ai/ai-runtime";
import { createSessionRepository } from "@conversational-ai/session-store";
import type { AuthContext } from "../lib/jwt-context.js";
import { startAgentWorkflow } from "./workflowService.js";

const repo = createSessionRepository();

function getModelConfig() {
  return {
    lightweightModelId: process.env.BEDROCK_MODEL_ID_LIGHT ?? "amazon.nova-micro-v1:0",
    reasoningModelId:
      process.env.BEDROCK_MODEL_ID_REASONING ?? "anthropic.claude-3-5-haiku-20241022-v1:0",
  };
}

export async function postMessage(
  auth: AuthContext,
  sessionId: string,
  body: unknown,
  options?: { idempotencyKey?: string },
): Promise<PostMessageResponse> {
  const parsed = postMessageRequestSchema.parse(body);
  const meta = await repo.getSession(auth.tenantId, sessionId);
  if (!meta || meta.userId !== auth.userId) {
    throw new AppError("NOT_FOUND", "Session not found", { statusCode: 404 });
  }

  if (parsed.mode === "workflow") {
    const executionArn = await startAgentWorkflow({
      tenantId: auth.tenantId,
      userId: auth.userId,
      sessionId,
      content: parsed.content,
    });
    const assistantMessage = {
      role: "assistant" as const,
      content: `Workflow started (${executionArn}). Results will be available when the run completes.`,
      createdAt: new Date().toISOString(),
    };
    await repo.appendMessage({
      tenantId: auth.tenantId,
      sessionId,
      message: { role: "user", content: parsed.content },
    });
    await repo.appendMessage({
      tenantId: auth.tenantId,
      sessionId,
      message: assistantMessage,
    });
    return postMessageResponseSchema.parse({
      sessionId,
      message: assistantMessage,
      toolCalls: [],
    });
  }

  const history = await repo.listMessages(auth.tenantId, sessionId);
  await repo.appendMessage({
    tenantId: auth.tenantId,
    sessionId,
    message: { role: "user", content: parsed.content },
  });

  const runtime = createAgentRuntime(getModelConfig());
  const result = await runtime.runTurn({
    tenantId: auth.tenantId,
    userId: auth.userId,
    sessionId,
    messages: history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    userContent: parsed.content,
    idempotencyKey: options?.idempotencyKey,
  });

  const assistantMessage = {
    role: "assistant" as const,
    content: result.assistantMessage,
    createdAt: new Date().toISOString(),
  };

  await repo.appendMessage({
    tenantId: auth.tenantId,
    sessionId,
    message: assistantMessage,
  });

  return postMessageResponseSchema.parse({
    sessionId,
    message: assistantMessage,
    toolCalls: result.toolCalls,
    usage: result.usage,
  });
}

export type StreamHandlers = {
  onEvent: (event: import("@conversational-ai/shared").StreamEvent) => void;
};

export async function postMessageStream(
  auth: AuthContext,
  sessionId: string,
  body: unknown,
  handlers: StreamHandlers,
): Promise<void> {
  const parsed = postMessageRequestSchema.parse(body);
  const meta = await repo.getSession(auth.tenantId, sessionId);
  if (!meta || meta.userId !== auth.userId) {
    throw new AppError("NOT_FOUND", "Session not found", { statusCode: 404 });
  }

  const history = await repo.listMessages(auth.tenantId, sessionId);
  await repo.appendMessage({
    tenantId: auth.tenantId,
    sessionId,
    message: { role: "user", content: parsed.content },
  });

  const bedrock = new BedrockClient({
    config: getModelConfig(),
    mock: process.env.BEDROCK_MOCK !== "false",
  });
  const runtime = new AgentRuntime({
    bedrock,
    onStreamToken: (token: string) => handlers.onEvent({ type: "token", content: token }),
    onAudit: (entry) => {
      handlers.onEvent({ type: "tool_start", toolName: entry.toolName });
      handlers.onEvent({
        type: "tool_end",
        toolName: entry.toolName,
        status: entry.status,
      });
    },
  });
  const result = await runtime.runTurn({
    tenantId: auth.tenantId,
    userId: auth.userId,
    sessionId,
    messages: history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    userContent: parsed.content,
  });

  for (const tc of result.toolCalls) {
    handlers.onEvent({ type: "tool_start", toolName: tc.toolName });
    handlers.onEvent({
      type: "tool_end",
      toolName: tc.toolName,
      status: tc.status,
    });
  }

  const assistantMessage = {
    role: "assistant" as const,
    content: result.assistantMessage,
    createdAt: new Date().toISOString(),
  };
  await repo.appendMessage({
    tenantId: auth.tenantId,
    sessionId,
    message: assistantMessage,
  });

  handlers.onEvent({ type: "done", sessionId });
}
