import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@conversational-ai/shared": path.join(rootDir, "packages/shared/src/index.ts"),
      "@conversational-ai/tool-registry": path.join(rootDir, "packages/tool-registry/src/index.ts"),
      "@conversational-ai/ai-runtime": path.join(rootDir, "packages/ai-runtime/src/index.ts"),
    },
  },
});
