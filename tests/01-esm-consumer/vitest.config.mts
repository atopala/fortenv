import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";
export default defineConfig({
   root: fileURLToPath(new URL(".", import.meta.url)),
   test: {
      name: "esm-consumer",
      environment: "node",
      include: ["**/*.test.ts"],
      exclude: [...configDefaults.exclude, "**/dist/**"],
   },
});
