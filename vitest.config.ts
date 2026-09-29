import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: { alias: [{ find: "@", replacement: src }, { find: "server-only", replacement: `${src}/lib/payments/__tests__/empty.ts` }] },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
