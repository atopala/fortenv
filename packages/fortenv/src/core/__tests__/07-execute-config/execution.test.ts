import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { transformImports } from "../../imports.js";
import { createMockLoader } from "../../mock-imports.js";
import { executeSyntheticConfig } from "../../synthetic-execution.js";

describe("07 — Execute synthetic config", () => {
   it("executes transformed config with the production loader and returns placeholders", async () => {
      const file = new URL("./config.mjs", import.meta.url);
      const placeholders = new WeakSet<Function>();
      const transformed = transformImports(readFileSync(file, "utf8"));
      const result = await executeSyntheticConfig(transformed, fileURLToPath(file), createMockLoader(placeholders));
      expect(result).toHaveProperty("secrets.DATABASE_URL");
      const secrets = Reflect.get(result as object, "secrets");
      expect(Object.keys(secrets)).toEqual(["DATABASE_URL"]);
      expect(placeholders.has(secrets.DATABASE_URL[0])).toBe(true);
   });

   it.each([
      ["process.mjs", /process is not defined/],
      ["require.mjs", /require is not defined/],
      ["timer.mjs", /setTimeout is not defined/],
      ["native-import.mjs", /dynamic import|callback/i],
      ["code-generation.mjs", /code generation.*disallowed/i],
      ["throw.mjs", /SYNTHETIC_EXECUTION_FAILED/],
      ["rejection.mjs", /SYNTHETIC_EXECUTION_REJECTED/],
      ["loop.mjs", /timed out/],
   ] as const)("reports an execution-stage failure for %s", async (filename, diagnostic) => {
      const file = new URL(filename, import.meta.url);
      const transformed = transformImports(readFileSync(file, "utf8"));
      await expect(
         executeSyntheticConfig(transformed, fileURLToPath(file), createMockLoader(new WeakSet())),
      ).rejects.toThrow(diagnostic);
   });
});
