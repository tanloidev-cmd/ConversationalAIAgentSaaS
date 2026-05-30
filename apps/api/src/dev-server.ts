import { createServer } from "node:http";
import { handleHealthLocal } from "./handlers/healthHandler.js";

const port = Number(process.env.API_PORT ?? 3001);

const server = createServer(async (req, res) => {
  if (req.url === "/v1/health" && req.method === "GET") {
    const result = await handleHealthLocal();
    const statusCode =
      typeof result === "object" && result !== null && "statusCode" in result
        ? (result.statusCode as number)
        : 500;
    const headers =
      typeof result === "object" && result !== null && "headers" in result
        ? (result.headers as Record<string, string>)
        : {};
    const body =
      typeof result === "object" && result !== null && "body" in result
        ? (result.body as string)
        : "{}";
    res.writeHead(statusCode, headers);
    res.end(body);
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ code: "NOT_FOUND", message: "Not found" }));
});

server.listen(port, () => {
  console.log(`API dev server listening on http://localhost:${port}`);
});
