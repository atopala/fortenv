import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// Attack: invoke wrapped functions before/around bootstrap readiness (sync during
// config evaluation, plus via microtask and timer). The secret must never be
// obtainable early. If any early call sees the value, this test fails (red) —
// that would be a real vulnerability.
describe("15.06 SEC-11 — wrapped calls cannot obtain a secret before bootstrap is ready", () => {
   it("never delivers the secret to an early invocation", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs"], {
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
      // No secret value may appear anywhere in the output.
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-database");

      const line = result.stdout.split("\n").find((l) => l.trim().startsWith("{"));
      const observed = JSON.parse(line ?? "{}");
      // Core assertion: no pre-ready invocation obtained the secret.
      expect(observed.earlySawSecret).toBe(false);
      // Every pre-ready attempt was denied with the not-ready error.
      expect(observed.allEarlyDenied).toBe(true);
      // Sanity: the attack actually ran, and normal post-ready calls still work.
      expect(observed.earlyAttemptLabels.length).toBeGreaterThan(0);
      expect(observed.normalCallSawSecret).toBe(true);
      expect(observed.ambientReadDenied).toBe(true);
   });
});
