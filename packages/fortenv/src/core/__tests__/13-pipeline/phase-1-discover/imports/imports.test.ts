import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { discoverSecrets } from "../../../../discovery.js";

describe("13 — Discovery import forms", () => {
   const executed = Symbol.for("fortenv.test.phase-one.application-executed");

   beforeEach(() => {
      Reflect.deleteProperty(globalThis, executed);
   });
   afterEach(() => {
      Reflect.deleteProperty(globalThis, executed);
   });

   it.each([
      ["named.config.mjs", ["DATABASE_URL", "STRIPE_SECRET_KEY"], [1, 1]],
      ["default.config.mjs", ["DATABASE_URL"], [1]],
      ["aliased.config.mjs", ["DATABASE_URL"], [1]],
      ["mixed.config.mjs", ["DATABASE_URL", "STRIPE_SECRET_KEY"], [1, 1]],
      ["default-as-named.config.mjs", ["DATABASE_URL"], [1]],
      ["quoted-export.config.mjs", ["DATABASE_URL"], [1]],
      ["then-export.config.mjs", ["DATABASE_URL"], [1]],
      ["multiple-readers.config.mjs", ["DATABASE_URL", "DATABASE_PASSWORD"], [2, 2]],
      ["javascript.config.js", ["DATABASE_URL"], [1]],
      ["empty-policy.config.mjs", [], []],
      ["empty-grants.config.mjs", ["DATABASE_URL"], [0]],
   ])("discovers names using inert imported bindings: %s", async (filename, names, counts) => {
      const file = new URL(filename, import.meta.url);
      const result = await discoverSecrets(readFileSync(file, "utf8"), fileURLToPath(file));

      expect([...result.keys()]).toEqual(names);
      expect([...result.values()].map((readers) => readers.length)).toEqual(counts);
      for (const readers of result.values()) {
         for (const reader of readers) expect(typeof reader).toBe("function");
      }
      // application.mjs records evaluation and throws. Its real exports must never load.
      expect(Reflect.has(globalThis, executed)).toBe(false);
   });
});
