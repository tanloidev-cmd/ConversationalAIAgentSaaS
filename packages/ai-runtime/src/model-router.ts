export type ModelTier = "lightweight" | "reasoning";

export type ModelRouterConfig = {
  lightweightModelId: string;
  reasoningModelId: string;
};

export function selectModelTier(input: {
  content: string;
  requiresTools?: boolean;
  forceReasoning?: boolean;
}): ModelTier {
  if (input.forceReasoning || input.requiresTools) {
    return "reasoning";
  }
  const complex =
    input.content.length > 400 ||
    /\b(workflow|analyze|plan|multi-step|orchestrat)\b/i.test(input.content);
  return complex ? "reasoning" : "lightweight";
}

export function resolveModelId(tier: ModelTier, config: ModelRouterConfig): string {
  return tier === "reasoning" ? config.reasoningModelId : config.lightweightModelId;
}
