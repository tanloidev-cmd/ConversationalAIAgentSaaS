import { z } from "zod";

export const chatMessageRoleSchema = z.enum(["user", "assistant", "system"]);

export const createSessionRequestSchema = z.object({
  title: z.string().max(200).optional(),
});

export const createSessionResponseSchema = z.object({
  sessionId: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  title: z.string().optional(),
  createdAt: z.string(),
});

export const chatMessageSchema = z.object({
  role: chatMessageRoleSchema,
  content: z.string(),
  createdAt: z.string().optional(),
});

export const sessionDetailResponseSchema = z.object({
  sessionId: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  title: z.string().optional(),
  messages: z.array(chatMessageSchema),
});

export const postMessageRequestSchema = z.object({
  content: z.string().min(1).max(32_000),
  mode: z.enum(["sync", "workflow"]).optional().default("sync"),
});

export const toolCallRecordSchema = z.object({
  toolName: z.string(),
  status: z.enum(["success", "error"]),
  resultPreview: z.string().optional(),
});

export const postMessageResponseSchema = z.object({
  sessionId: z.string(),
  message: chatMessageSchema,
  toolCalls: z.array(toolCallRecordSchema).optional(),
  usage: z
    .object({
      inputTokens: z.number().optional(),
      outputTokens: z.number().optional(),
    })
    .optional(),
});

export const streamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("token"), content: z.string() }),
  z.object({
    type: z.literal("tool_start"),
    toolName: z.string(),
  }),
  z.object({
    type: z.literal("tool_end"),
    toolName: z.string(),
    status: z.enum(["success", "error"]),
  }),
  z.object({ type: z.literal("error"), message: z.string() }),
  z.object({ type: z.literal("done"), sessionId: z.string() }),
]);

export type StreamEvent = z.infer<typeof streamEventSchema>;
