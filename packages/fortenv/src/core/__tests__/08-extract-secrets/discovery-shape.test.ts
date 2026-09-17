import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { discoverSecrets } from "../../discovery.js";

describe("08 — Reject invalid discovery results", () => {
   it.each([
      ["missing-secrets.config.mjs", /secrets/i],
      ["invalid-secrets.config.mjs", /secrets.*object/i],
      ["invalid-result.config.mjs", /configuration.*object/i],
   ])("rejects invalid evaluated config shape: %s", async (filename, diagnostic) => {
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
      // Match the explanation, not a keyword that happens to occur in the fixture's path.
      expect(error.message.replace(filepath, "<config>")).toMatch(diagnostic);
   });
});
