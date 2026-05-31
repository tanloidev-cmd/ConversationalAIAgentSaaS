import { createServer } from "node:http";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { handleHealthLocal } from "./handlers/healthHandler.js";
import { handler as meHandler } from "./handlers/meHandler.js";
import { handler as sessionsHandler } from "./handlers/sessionsHandler.js";
import { handler as chatHandler } from "./handlers/chatHandler.js";
import { handler as chatStreamHandler } from "./handlers/chatStreamHandler.js";
import { patchEventWithDevJwt } from "./lib/dev-auth.js";

const port = Number(process.env.API_PORT ?? 3001);

function buildEvent(
  req: import("node:http").IncomingMessage,
  body: string,
): APIGatewayProxyEventV2 {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  const pathParams: Record<string, string> = {};
  const sessionMatch = /^\/v1\/sessions\/([^/]+)/.exec(url.pathname);
  if (sessionMatch?.[1]) {
    pathParams.sessionId = sessionMatch[1];
  }
  const base: APIGatewayProxyEventV2 = {
    version: "2.0",
    routeKey: `${req.method} ${url.pathname}`,
    rawPath: url.pathname,
    pathParameters: pathParams,
    rawQueryString: url.searchParams.toString(),
    headers: Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : (v ?? "")]),
    ),
    requestContext: {
      accountId: "local",
      apiId: "local",
      domainName: "localhost",
      domainPrefix: "localhost",
      http: {
        method: req.method ?? "GET",
        path: url.pathname,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: req.headers["user-agent"] ?? "",
      },
      requestId: `local-${Date.now()}`,
      routeKey: `${req.method} ${url.pathname}`,
      stage: "local",
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    body: body || undefined,
    isBase64Encoded: false,
  };
  return patchEventWithDevJwt(base);
}

async function sendLambdaResult(
  res: import("node:http").ServerResponse,
  result: Awaited<ReturnType<typeof meHandler>>,
): Promise<void> {
  const statusCode =
    typeof result === "object" && result !== null && "statusCode" in result
      ? (result.statusCode as number)
      : 500;
  const headers =
    typeof result === "object" && result !== null && "headers" in result
      ? (result.headers as Record<string, string | number>)
      : {};
  const body =
    typeof result === "object" && result !== null && "body" in result
      ? (result.body as string)
      : "{}";
  for (const [k, v] of Object.entries(headers)) {
    res.setHeader(k, String(v));
  }
  res.writeHead(statusCode);
  res.end(body);
}

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const path = req.url?.split("?")[0] ?? "/";

  if (path === "/v1/health" && req.method === "GET") {
    await sendLambdaResult(res, await handleHealthLocal());
    return;
  }

  const body = req.method === "POST" || req.method === "PUT" ? await readBody(req) : "";
  const event = buildEvent(req, body);

  try {
    if (path === "/v1/me" && req.method === "GET") {
      await sendLambdaResult(res, await meHandler(event, { awsRequestId: "local" } as never));
      return;
    }
    if (path === "/v1/sessions" && req.method === "POST") {
      await sendLambdaResult(res, await sessionsHandler(event, { awsRequestId: "local" } as never));
      return;
    }
    if (/^\/v1\/sessions\/[^/]+$/.test(path) && req.method === "GET") {
      await sendLambdaResult(res, await sessionsHandler(event, { awsRequestId: "local" } as never));
      return;
    }
    if (/^\/v1\/sessions\/[^/]+\/messages$/.test(path) && req.method === "POST") {
      await sendLambdaResult(res, await chatHandler(event, { awsRequestId: "local" } as never));
      return;
    }
    if (/^\/v1\/sessions\/[^/]+\/messages\/stream$/.test(path) && req.method === "POST") {
      await sendLambdaResult(res, await chatStreamHandler(event));
      return;
    }
  } catch (err) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ code: "INTERNAL_ERROR", message: String(err) }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ code: "NOT_FOUND", message: "Not found" }));
});

server.listen(port, () => {
  console.log(`API dev server listening on http://localhost:${port}`);
  console.log(
    `DEV_AUTH_BYPASS=${process.env.DEV_AUTH_BYPASS ?? "false"} BEDROCK_MOCK=${process.env.BEDROCK_MOCK ?? "true"}`,
  );
});
