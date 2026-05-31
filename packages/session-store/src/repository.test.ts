import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: vi.fn(() => ({ send: vi.fn() })),
}));
vi.mock("@aws-sdk/lib-dynamodb", async () => {
  const actual =
    await vi.importActual<typeof import("@aws-sdk/lib-dynamodb")>("@aws-sdk/lib-dynamodb");
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: vi.fn(() => ({ send: vi.fn() })),
    },
  };
});

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SessionRepository } from "./repository.js";

describe("SessionRepository", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DYNAMODB_ENDPOINT;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("uses local credentials when DYNAMODB_ENDPOINT is a local endpoint", () => {
    process.env.DYNAMODB_ENDPOINT = "http://localhost:8000";

    new SessionRepository({ tableName: "test-table" });

    expect(DynamoDBClient).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "http://localhost:8000",
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      }),
    );
  });
});
