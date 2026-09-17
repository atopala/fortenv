import { defineConfig } from "vitest/config";

export default defineConfig({
   test: {
      projects: [
         "packages/fortenv/vitest.config.ts",
         "tests/telemetry-integration/vitest.config.ts",
         "tests/01-esm-consumer/vitest.config.mts",
         "tests/02-cjs-consumer/vitest.config.mts",
      ],
   },
});
