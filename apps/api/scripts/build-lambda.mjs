import * as esbuild from "esbuild";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "dist", "lambda");

const handlers = [
  { entry: "src/handlers/healthHandler.ts", outfile: "health.zip", exportName: "handler" },
  { entry: "src/handlers/meHandler.ts", outfile: "me.zip", exportName: "handler" },
];

await mkdir(outDir, { recursive: true });

for (const h of handlers) {
  const outfile = path.join(outDir, h.outfile.replace(".zip", ".js"));
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
