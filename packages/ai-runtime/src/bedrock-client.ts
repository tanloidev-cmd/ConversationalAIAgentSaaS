import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandInput,
  type Message,
  type ToolConfiguration,
} from "@aws-sdk/client-bedrock-runtime";
import type { ModelRouterConfig } from "./model-router.js";
import { resolveModelId, selectModelTier, type ModelTier } from "./model-router.js";

export type BedrockMessage = { role: "user" | "assistant"; content: string };

export type ConverseResult = {
  text: string;
  toolCalls: Array<{ name: string; input: unknown }>;
  stopReason: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  modelId: string;
  tier: ModelTier;
};

export type BedrockClientOptions = {
  region?: string;
  config: ModelRouterConfig;
  mock?: boolean;
};

export class BedrockClient {
  private readonly sdk: BedrockRuntimeClient | null;
  private readonly config: ModelRouterConfig;
  private readonly mock: boolean;

  constructor(options: BedrockClientOptions) {
    this.config = options.config;
    this.mock = options.mock ?? process.env.BEDROCK_MOCK === "true";
    this.sdk = this.mock
      ? null
      : new BedrockRuntimeClient({
          region: options.region ?? process.env.AWS_REGION ?? "us-east-1",
        });
  }

  async converse(input: {
    messages: BedrockMessage[];
    system: string;
    tools?: {
      tools: Array<{
        name: string;
        description: string;
        inputSchema: { json: Record<string, unknown> };
      }>;
    };
    userContent: string;
    requiresTools?: boolean;
  }): Promise<ConverseResult> {
    const tier = selectModelTier({
      content: input.userContent,
      requiresTools: input.requiresTools ?? Boolean(input.tools),
    });
    const modelId = resolveModelId(tier, this.config);

    if (this.mock || !this.sdk) {
      return mockConverse(input.userContent, modelId, tier, input.tools);
    }

    const bedrockMessages: Message[] = input.messages.map((m) => ({
      role: m.role,
      content: [{ text: m.content }],
    }));

    const cmdInput: ConverseCommandInput = {
      modelId,
      system: [{ text: input.system }],
      messages: bedrockMessages,
      toolConfig: input.tools
        ? ({ tools: input.tools.tools } as unknown as ToolConfiguration)
        : undefined,
      inferenceConfig: { maxTokens: 1024, temperature: 0.3 },
    };

    const response = await this.sdk.send(new ConverseCommand(cmdInput));
    const text =
      response.output?.message?.content?.map((c) => ("text" in c ? c.text : "")).join("") ?? "";
    const toolCalls = parseToolCalls(response.output?.message?.content);

    return {
      text,
      toolCalls,
      stopReason: response.stopReason ?? "end_turn",
      usage: {
        inputTokens: response.usage?.inputTokens,
        outputTokens: response.usage?.outputTokens,
      },
      modelId,
      tier,
    };
  }
}

function parseToolCalls(
  content: Array<{ toolUse?: { name?: string; input?: unknown } }> | undefined,
): Array<{ name: string; input: unknown }> {
  if (!content) return [];
  const calls: Array<{ name: string; input: unknown }> = [];
  for (const block of content) {
    if (block.toolUse?.name) {
      calls.push({ name: block.toolUse.name, input: block.toolUse.input ?? {} });
    }
  }
  return calls;
}

function mockConverse(
  userContent: string,
  modelId: string,
  tier: ModelTier,
  tools?: {
    tools: Array<{
      name: string;
      description: string;
      inputSchema: { json: Record<string, unknown> };
    }>;
  },
): ConverseResult {
  const wantsTime = /\b(time|date|now)\b/i.test(userContent);
  if (wantsTime && tools) {
    return {
      text: "",
      toolCalls: [{ name: "get_current_time", input: { timezone: "UTC" } }],
      stopReason: "tool_use",
      modelId,
      tier,
    };
  }
  return {
    text: `[mock:${tier}] You said: ${userContent.slice(0, 200)}`,
    toolCalls: [],
    stopReason: "end_turn",
    usage: { inputTokens: 10, outputTokens: 20 },
    modelId,
    tier,
  };
}
