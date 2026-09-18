import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// SEC-20: the config declares a different secret set during phase-1 discovery
// (imports mocked) than during the real phase-2 import (side effect runs). The
// fail-closed contract: Fortenv must not serve or leave ambiently readable a
// secret it never protected. A clean bootstrap failure is an acceptable outcome;
// a leak of the undiscovered value is not.
describe("15.06 SEC-20 — nondeterministic config cannot leak an undiscovered secret", () => {
   it("never exposes the real-only SECRET_TWO value", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs"], {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 10_000,
         env: {
            PATH: process.env.PATH,
            ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
            DATABASE_URL: "fake-hardening-database",
            SECRET_TWO: "fake-hardening-secret-two",
         },
      });
      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      // No secret VALUE may appear anywhere in the process output.
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-database");
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-secret-two");

      if (result.stdout.includes("APP_STARTED")) {
         // If the application ran at all, the undiscovered secret must not be
         // ambiently readable and the protected one must stay denied.
         const line = result.stdout.split("\n").find((l) => l.trim().startsWith("{"));
         const observed = JSON.parse(line ?? "{}");
         expect(observed.secretTwoAmbientReadable).toBe(false);
         expect(observed.databaseDenied).toBe(true);
      } else {
         // Otherwise Fortenv failed closed at bootstrap before the app ran.
         expect(result.status, result.stdout + result.stderr).not.toBe(0);
      }
   });
});
