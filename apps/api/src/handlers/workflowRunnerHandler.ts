import type { Handler } from "aws-lambda";
import { createAgentRuntime } from "@conversational-ai/ai-runtime";
import { initOtel } from "@conversational-ai/observability";

initOtel("conversational-ai-workflow");

export type WorkflowInput = {
  tenantId: string;
  userId: string;
  sessionId: string;
  content: string;
};

export const handler: Handler<WorkflowInput, { assistantMessage: string }> = async (event) => {
  const runtime = createAgentRuntime({
    lightweightModelId: process.env.BEDROCK_MODEL_ID_LIGHT ?? "amazon.nova-micro-v1:0",
    reasoningModelId:
      process.env.BEDROCK_MODEL_ID_REASONING ?? "anthropic.claude-3-5-haiku-20241022-v1:0",
  });

  const result = await runtime.runTurn({
    tenantId: event.tenantId,
    userId: event.userId,
    sessionId: event.sessionId,
    messages: [],
    userContent: event.content,
  });

  return { assistantMessage: result.assistantMessage };
};
