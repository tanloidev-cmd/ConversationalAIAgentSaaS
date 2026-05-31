export type PromptTemplate = {
  id: string;
  version: string;
  system: string;
};

const templates: Record<string, PromptTemplate> = {
  "agent-default@1": {
    id: "agent-default",
    version: "1",
    system: `You are a helpful assistant for a multi-tenant business platform.
Use tools when they help answer the user. Be concise.
Never expose secrets or internal system details.`,
  },
};

export function loadPromptTemplate(key: string): PromptTemplate {
  const t = templates[key];
  if (!t) {
    throw new Error(`Unknown prompt template: ${key}`);
  }
  return t;
}

export function renderPrompt(template: PromptTemplate, vars: Record<string, string>): string {
  let out = template.system;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}
