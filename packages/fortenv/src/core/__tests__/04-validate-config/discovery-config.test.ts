import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { discoverSecrets } from "../../discovery.js";

describe("04 — Validate evaluated config values", () => {
   const executed = Symbol.for("fortenv.test.phase-one.application-executed");
   beforeEach(() => {
      Reflect.deleteProperty(globalThis, executed);
   });
   afterEach(() => {
      Reflect.deleteProperty(globalThis, executed);
   });

   it.each([
      "computed-name.config.mjs",
      "computed-literal.config.mjs",
      "computed-call.config.mjs",
      "runtime-factory.config.mjs",
      "side-effect-import.config.mjs",
      "empty-import.config.mjs",
      "top-level-call.config.mjs",
   ])("accepts valid config values from %s without executing application imports", async (filename) => {
      const file = new URL(filename, import.meta.url);
      const entries = await discoverSecrets(readFileSync(file, "utf8"), fileURLToPath(file));

      expect([...entries.keys()]).toEqual(["DATABASE_URL"]);
      expect(entries.get("DATABASE_URL")).toHaveLength(1);
      expect(typeof entries.get("DATABASE_URL")?.[0]).toBe("function");
      expect(Reflect.has(globalThis, executed)).toBe(false);
   });

   it.each([
      ["dynamic-import.config.mjs", /dynamic|import|declarative/i],
      ["top-level-throw.config.mjs", /CONFIG_EVALUATION_FAILED/],
      ["missing-default.config.mjs", /default.*export/i],
      ["malformed/broken-import.config.mjs", /import|syntax|unexpected/i],
      ["malformed/unclosed-object.config.mjs", /syntax|unexpected|unterminated/i],
      ["invalid-factory.config.mjs", /grants.*array/i],
      ["invalid-computed-name.config.mjs", /secret names must be nonempty/i],
      ["local-reader.config.mjs", /grant references must come from imported modules/i],
      ["discarded-invalid-config.config.mjs", /grants.*array/i],
   ])("reports the actual syntax, execution, or value error from %s", async (filename, diagnostic) => {
      const file = new URL(filename, import.meta.url);
      const filepath = fileURLToPath(file);
      const error: unknown = await discoverSecrets(readFileSync(file, "utf8"), filepath).then(
         () => undefined,
         (cause: unknown) => cause,
      );

      assert.ok(error instanceof Error, "Phase one must reject this config instead of returning secret names.");
      expect(error.message).toContain("Fortenv:");
      expect(error.message).toContain(filepath);
      expect(error.message).not.toContain("REAL_APPLICATION_MODULE_EXECUTED");
      expect(Reflect.has(globalThis, executed)).toBe(false);
      // Match the explanation, not a keyword that happens to occur in the fixture's path.
      expect(error.message.replace(filepath, "<config>")).toMatch(diagnostic);
   });
});
