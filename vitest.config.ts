import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps/web/src"),
      "@neofile/core": path.resolve(__dirname, "packages/core/src/index.ts"),
    },
  },
  test: {
    include: ["packages/core/test/**/*.test.ts", "apps/web/test/**/*.test.ts"],
    environment: "node",
  },
});
