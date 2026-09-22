import { defineConfig } from "vitest/config";

export default defineConfig({
   test: {
      projects: [
         "packages/fortenv/vitest.config.ts",
         "tests/telemetry-integration/vitest.config.ts",
         "tests/01-esm-consumer/vitest.config.mts",
         "tests/02-cjs-consumer/vitest.config.mts",
      ],
      coverage: {
         provider: "v8",
         reporter: ["text", "lcov"],
         // Report coverage of the core library source only. Test fixtures,
         // integration harnesses, generated output, and config files are excluded
         // so the number reflects the shipped code.
         include: ["packages/fortenv/src/**/*.ts"],
         exclude: ["**/__tests__/**", "**/dist/**", "**/*.config.*", "**/*.test.ts"],
      },
   },
});
