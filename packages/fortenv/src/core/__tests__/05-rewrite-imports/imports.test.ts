import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { transformImports } from "../../imports.js";

describe("05 — Rewrite imports", () => {
   it.each([
      "named.config.mjs",
      "default.config.mjs",
      "aliased.config.mjs",
      "mixed.config.mjs",
      "namespace.config.mjs",
      "default-and-namespace.config.mjs",
      "quoted-export.config.mjs",
      "then-export.config.mjs",
      "hoisted.config.mjs",
      "formatting.config.mjs",
      "unicode-bindings.config.mjs",
      "escaped-bindings.config.mjs",
   ])("transforms %s", async (filename) => {
      const source = readFileSync(new URL(filename, import.meta.url), "utf8");
      const snapshot = new URL(`__snapshots__/${filename}`, import.meta.url);
      const executable = [
         "// Generated snapshot. Update through Vitest; see ../README.md.",
         'import { createMockLoader } from "../../../../../dist/core/mock-imports.js";',
         "",
         "const config = await (async (__fortenv_import) => {",
         transformImports(source),
         "})(createMockLoader(new WeakSet()));",
         "",
         "console.dir(config, { depth: null });",
         "export default config;",
         "",
      ].join("\n");

      await expect(executable).toMatchFileSnapshot(fileURLToPath(snapshot));
   });

   it("executes escaped bindings with the same identities as their unescaped names", () => {
      const result = spawnSync(
         process.execPath,
         [fileURLToPath(new URL("escaped-bindings.check.mjs", import.meta.url))],
         {
            encoding: "utf8",
            timeout: 15_000,
         },
      );
      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
   });

   it("recognizes the reserved generated-name prefix when escaped", () => {
      const source = readFileSync(new URL("escaped-reserved.config.mjs", import.meta.url), "utf8");
      expect(() => transformImports(source)).toThrow("identifiers starting with __fortenv_ are reserved");
   });
});
