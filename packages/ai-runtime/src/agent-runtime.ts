import {
  createDefaultRegistry,
  executeTool,
  type ToolAuditEntry,
  type ToolRegistry,
} from "@conversational-ai/tool-registry";
import { BedrockClient, type BedrockMessage } from "./bedrock-client.js";
import { loadPromptTemplate, renderPrompt } from "./prompt-template.js";
import type { ModelRouterConfig } from "./model-router.js";

export type AgentMessage = BedrockMessage;

export type AgentTurnResult = {
  assistantMessage: string;
  toolCalls: Array<{ toolName: string; status: "success" | "error"; resultPreview?: string }>;
  usage?: { inputTokens?: number; outputTokens?: number };
};

export type AgentRuntimeOptions = {
  bedrock: BedrockClient;
  registry?: ToolRegistry;
  maxToolIterations?: number;
  onAudit?: (entry: ToolAuditEntry) => void;
  onStreamToken?: (token: string) => void;
};

export class AgentRuntime {
  private readonly bedrock: BedrockClient;
  private readonly registry: ToolRegistry;
  private readonly maxToolIterations: number;
  private readonly onAudit?: (entry: ToolAuditEntry) => void;
  private readonly onStreamToken?: (token: string) => void;

  constructor(options: AgentRuntimeOptions) {
    this.bedrock = options.bedrock;
    this.registry = options.registry ?? createDefaultRegistry();
    this.maxToolIterations = options.maxToolIterations ?? 5;
    this.onAudit = options.onAudit;
    this.onStreamToken = options.onStreamToken;
  }

  async runTurn(input: {
    tenantId: string;
    userId: string;
    sessionId: string;
    messages: AgentMessage[];
    userContent: string;
    idempotencyKey?: string;
  }): Promise<AgentTurnResult> {
    const template = loadPromptTemplate("agent-default@1");
    const system = renderPrompt(template, { tenantId: input.tenantId });
    const toolCalls: AgentTurnResult["toolCalls"] = [];
    let usage: AgentTurnResult["usage"];
    const workingMessages: AgentMessage[] = [
      ...input.messages,
      { role: "user", content: input.userContent },
    ];
    let userContent = input.userContent;

    for (let i = 0; i < this.maxToolIterations; i++) {
      const toolSpecs = this.registry.toBedrockToolSpecs();
      const tools = toolSpecs.length > 0 ? { tools: toolSpecs } : undefined;

      const result = await this.bedrock.converse({
        messages: workingMessages,
        system,
        tools,
        userContent,
        requiresTools: i > 0,
      });

      usage = mergeUsage(usage, result.usage);

      if (result.toolCalls.length === 0) {
        this.emitTokens(result.text);
        return { assistantMessage: result.text, toolCalls, usage };
      }

      for (const call of result.toolCalls) {
        this.onStreamToken?.(`\n[tool:${call.name}]\n`);
        try {
          const output = await executeTool(
            this.registry,
            call.name,
            call.input,
            {
              tenantId: input.tenantId,
              userId: input.userId,
              sessionId: input.sessionId,
              idempotencyKey: input.idempotencyKey,
            },
            { auditLog: this.onAudit },
          );
          toolCalls.push({
            toolName: call.name,
            status: "success",
            resultPreview: JSON.stringify(output).slice(0, 200),
          });
          workingMessages.push({
            role: "assistant",
            content: `Called tool ${call.name}`,
          });
          userContent = `Tool ${call.name} result: ${JSON.stringify(output)}`;
        } catch (err) {
          toolCalls.push({
            toolName: call.name,
            status: "error",
            resultPreview: err instanceof Error ? err.message : "error",
          });
          userContent = `Tool ${call.name} failed: ${err instanceof Error ? err.message : "error"}`;
        }
      }
    }

    return {
      assistantMessage: "I could not complete the request within the tool iteration limit.",
      toolCalls,
      usage,
    };
  }

  private emitTokens(text: string): void {
    if (!this.onStreamToken || !text) return;
    const chunkSize = 12;
    for (let i = 0; i < text.length; i += chunkSize) {
      this.onStreamToken(text.slice(i, i + chunkSize));
    }
  }
}

export function createAgentRuntime(config: ModelRouterConfig): AgentRuntime {
  const bedrock = new BedrockClient({
    config,
    mock: process.env.BEDROCK_MOCK !== "false",
  });
  return new AgentRuntime({ bedrock });
}

function mergeUsage(
  a: AgentTurnResult["usage"],
  b: AgentTurnResult["usage"],
): AgentTurnResult["usage"] {
  return {
    inputTokens: (a?.inputTokens ?? 0) + (b?.inputTokens ?? 0),
    outputTokens: (a?.outputTokens ?? 0) + (b?.outputTokens ?? 0),
  };
}
