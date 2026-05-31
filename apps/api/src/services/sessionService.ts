import {
  createSessionRequestSchema,
  createSessionResponseSchema,
  sessionDetailResponseSchema,
} from "@conversational-ai/shared";
import type { z } from "zod";

type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;
type SessionDetailResponse = z.infer<typeof sessionDetailResponseSchema>;
import { AppError } from "@conversational-ai/shared";
import { createSessionRepository } from "@conversational-ai/session-store";
import type { AuthContext } from "../lib/jwt-context.js";

let repo: ReturnType<typeof createSessionRepository> | null = null;
function getRepo() {
  if (!repo) {
    repo = createSessionRepository();
  }
  return repo;
}

export async function createSession(
  auth: AuthContext,
  body: unknown,
): Promise<CreateSessionResponse> {
  const parsed = createSessionRequestSchema.parse(body ?? {});
  const meta = await getRepo().createSession({
    tenantId: auth.tenantId,
    userId: auth.userId,
    title: parsed.title,
  });
  return createSessionResponseSchema.parse(meta);
}

export async function getSessionDetail(
  auth: AuthContext,
  sessionId: string,
): Promise<SessionDetailResponse> {
  const meta = await getRepo().getSession(auth.tenantId, sessionId);
  if (!meta || meta.userId !== auth.userId) {
    throw new AppError("NOT_FOUND", "Session not found", { statusCode: 404 });
  }
  const messages = await getRepo().listMessages(auth.tenantId, sessionId);
  return sessionDetailResponseSchema.parse({
    sessionId: meta.sessionId,
    tenantId: meta.tenantId,
    userId: meta.userId,
    title: meta.title,
    messages,
  });
}
