import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import type { chatMessageSchema } from "@conversational-ai/shared";
import type { z } from "zod";

export type ChatMessage = z.infer<typeof chatMessageSchema>;
import {
  sessionMetaSk,
  sessionMessageSk,
  tenantPk,
  userSessionGsiPk,
  userSessionGsiSk,
} from "./keys.js";

export type SessionMeta = {
  sessionId: string;
  tenantId: string;
  userId: string;
  title?: string;
  createdAt: string;
};

export type SessionStoreConfig = {
  tableName: string;
  endpoint?: string;
  region?: string;
};

export class SessionRepository {
  private readonly doc: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(config: SessionStoreConfig) {
    const client = new DynamoDBClient({
      region: config.region ?? process.env.AWS_REGION ?? "ap-southeast-1",
      endpoint: config.endpoint ?? process.env.DYNAMODB_ENDPOINT,
      credentials: config.endpoint ? { accessKeyId: "local", secretAccessKey: "local" } : undefined,
    });
    this.doc = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
    this.tableName = config.tableName;
  }

  async createSession(input: {
    tenantId: string;
    userId: string;
    title?: string;
  }): Promise<SessionMeta> {
    const sessionId = ulid();
    const createdAt = new Date().toISOString();
    const meta: SessionMeta = {
      sessionId,
      tenantId: input.tenantId,
      userId: input.userId,
      title: input.title,
      createdAt,
    };

    await this.doc.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: tenantPk(input.tenantId),
          SK: sessionMetaSk(sessionId),
          GSI1PK: userSessionGsiPk(input.userId),
          GSI1SK: userSessionGsiSk(sessionId),
          entityType: "SESSION",
          ...meta,
        },
      }),
    );

    return meta;
  }

  async getSession(tenantId: string, sessionId: string): Promise<SessionMeta | null> {
    const res = await this.doc.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: tenantPk(tenantId), SK: sessionMetaSk(sessionId) },
      }),
    );
    if (!res.Item) return null;
    return {
      sessionId: res.Item.sessionId as string,
      tenantId: res.Item.tenantId as string,
      userId: res.Item.userId as string,
      title: res.Item.title as string | undefined,
      createdAt: res.Item.createdAt as string,
    };
  }

  async appendMessage(input: {
    tenantId: string;
    sessionId: string;
    message: ChatMessage;
  }): Promise<void> {
    const messageId = ulid();
    const createdAt = input.message.createdAt ?? new Date().toISOString();
    await this.doc.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: tenantPk(input.tenantId),
          SK: sessionMessageSk(input.sessionId, messageId),
          entityType: "MESSAGE",
          sessionId: input.sessionId,
          role: input.message.role,
          content: input.message.content,
          createdAt,
        },
      }),
    );
  }

  async listMessages(tenantId: string, sessionId: string, limit = 50): Promise<ChatMessage[]> {
    const res = await this.doc.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": tenantPk(tenantId),
          ":sk": `SESSION#${sessionId}#MSG#`,
        },
        ScanIndexForward: true,
        Limit: limit,
      }),
    );

    return (res.Items ?? []).map((item) => ({
      role: item.role as ChatMessage["role"],
      content: item.content as string,
      createdAt: item.createdAt as string,
    }));
  }
}

export function createSessionRepository(): SessionRepository {
  const tableName = process.env.SESSIONS_TABLE_NAME ?? "conversational-ai-sessions";
  return new SessionRepository({ tableName });
}
