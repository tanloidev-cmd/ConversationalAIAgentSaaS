import type { z, ZodTypeAny } from "zod";
import type { ToolDefinition } from "./types.js";
import { echoTool, getCurrentTimeTool } from "./tools/demo.js";

const BEDROCK_SCHEMAS: Record<string, Record<string, unknown>> = {
  echo: {
    type: "object",
    properties: { message: { type: "string", description: "Message to echo" } },
    required: ["message"],
  },
  get_current_time: {
    type: "object",
    properties: {
      timezone: { type: "string", description: "IANA timezone" },
    },
  },
};

type AnyTool = ToolDefinition<ZodTypeAny, ZodTypeAny>;

export class ToolRegistry {
  private readonly tools = new Map<string, AnyTool>();

  register<TIn extends z.ZodTypeAny, TOut extends z.ZodTypeAny>(
    tool: ToolDefinition<TIn, TOut>,
  ): void {
    this.tools.set(tool.name, tool as AnyTool);
  }

  get(name: string): AnyTool | undefined {
    return this.tools.get(name);
  }

  listForTenant(tenantId: string): AnyTool[] {
    void tenantId;
    return [...this.tools.values()];
  }

  toBedrockToolSpecs(): Array<{
    name: string;
    description: string;
    inputSchema: { json: Record<string, unknown> };
  }> {
    return [...this.tools.values()].map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: {
        json: BEDROCK_SCHEMAS[t.name] ?? { type: "object", properties: {} },
      },
    }));
  }
}

export function createDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(echoTool);
  registry.register(getCurrentTimeTool);
  return registry;
}
