import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// SEC-15: discovery must not execute application imports before protection is
// installed. The config imports a side-effecting module that records execution
// and attempts an ambient DATABASE_URL read. If discovery executed it in phase 1
// (before the guard), it would capture the secret. Correct behavior: it runs only
// in phase-2 real import, after the guard, so its read is denied and it never
// captures the value — and the secret never leaks.
describe("15.07 SEC-15 — discovery does not execute app imports before protection", () => {
   it("never lets an imported side effect capture the secret before the guard", () => {
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
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-database");
      expect(result.status, result.stderr).toBe(0);

      const line = result.stdout.split("\n").find((l) => l.trim().startsWith("{"));
      const observed = JSON.parse(line ?? "{}");
      // The imported side effect must never have captured the secret value.
      expect(observed.markerCapturedValue).toBe(false);
      // It ran only in phase 2 (after the guard), where its ambient read is denied.
      expect(observed.markerExecuted).toBe(true);
      expect(observed.markerReadThrew).toBe(true);
      expect(observed.authorizedCallSucceeded).toBe(true);
   });
});
