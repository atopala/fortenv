import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// Attack: tamper the `isGeneratorFunction` binding runtime.ts imports from
// node:util/types (CommonJS mutation + syncBuiltinESMExports) to slip a generator
// past fortenv()'s validation. Hardened contract: fortenv() captures
// isGeneratorFunction at load, so the generator is still REJECTED even when the
// live import binding is tampered — and no secret ever escapes.
describe("15.07 SEC-11a — tampering isGeneratorFunction cannot bypass the generator guard", () => {
   it("still rejects the generator and leaks no secret under binding tampering", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs", "config"], {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 10_000,
         env: {
            PATH: process.env.PATH,
            ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
            DATABASE_URL: "fake-hardening-database",
         },
      });
      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      // The core confidentiality assertion.
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-database");

      const line = result.stdout.split("\n").find((l) => l.trim().startsWith("{"));
      const observed = JSON.parse(line ?? "{}");
      expect(observed.tamperActive).toBe(true); // the binding tamper was active
      // Hardened: the generator guard holds despite the tamper.
      expect(observed.generatorWasWrapped).toBe(false);
      expect(observed.generatorSawSecret).toBe(false); // no secret escaped via the generator
      expect(observed.authorizedCallSucceeded).toBe(true); // normal path intact
   });
});
