import { z } from "zod";
import type { ToolDefinition } from "../types.js";

export const echoInputSchema = z.object({ message: z.string() });
export const echoOutputSchema = z.object({ echoed: z.string() });

export const echoTool: ToolDefinition<typeof echoInputSchema, typeof echoOutputSchema> = {
  name: "echo",
  description: "Echoes the input message back to the caller.",
  inputSchema: echoInputSchema,
  outputSchema: echoOutputSchema,
  permissions: ["tools:demo"],
  timeoutMs: 5_000,
  async execute(input) {
    return { echoed: input.message };
  },
};

export const getCurrentTimeInputSchema = z.object({
  timezone: z.string().optional().describe("IANA timezone, e.g. Asia/Ho_Chi_Minh"),
});
export const getCurrentTimeOutputSchema = z.object({
  iso: z.string(),
  timezone: z.string(),
});

export const getCurrentTimeTool: ToolDefinition<
  typeof getCurrentTimeInputSchema,
  typeof getCurrentTimeOutputSchema
> = {
  name: "get_current_time",
  description: "Returns the current date and time in ISO format.",
  inputSchema: getCurrentTimeInputSchema,
  outputSchema: getCurrentTimeOutputSchema,
  permissions: ["tools:demo"],
  timeoutMs: 5_000,
  async execute(input) {
    const tz = input.timezone ?? "UTC";
    const iso = new Date().toLocaleString("sv-SE", { timeZone: tz }).replace(" ", "T");
    return { iso: `${iso}Z`, timezone: tz };
  },
};
