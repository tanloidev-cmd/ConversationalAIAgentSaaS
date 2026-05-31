import * as esbuild from "esbuild";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "dist", "lambda");

const handlers = [
  { entry: "src/handlers/healthHandler.ts", outfile: "health.js" },
  { entry: "src/handlers/meHandler.ts", outfile: "me.js" },
  { entry: "src/handlers/sessionsHandler.ts", outfile: "sessions.js" },
  { entry: "src/handlers/chatHandler.ts", outfile: "chat.js" },
  { entry: "src/handlers/chatStreamHandler.ts", outfile: "chatStream.js" },
  { entry: "src/handlers/workflowRunnerHandler.ts", outfile: "workflowRunner.js" },
];

await mkdir(outDir, { recursive: true });

for (const h of handlers) {
  const outfile = path.join(outDir, h.outfile);
  await esbuild.build({
    entryPoints: [path.join(__dirname, "..", h.entry)],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    outfile,
    external: ["@aws-sdk/*"],
    sourcemap: true,
    minify: process.env.NODE_ENV === "production",
  });
  console.log(`Built ${outfile}`);
}

console.log("Lambda bundles ready in apps/api/dist/lambda/");
