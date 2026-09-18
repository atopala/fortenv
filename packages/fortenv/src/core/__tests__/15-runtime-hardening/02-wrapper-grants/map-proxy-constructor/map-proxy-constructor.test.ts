import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// Attack: replace the global Map and Proxy constructors during config evaluation,
// so the wrapper Proxy, the env guard Proxy, and internal Maps are all built
// through attacker-controlled constructors. Try to steal a secret or forge a
// grant. The test fails if a secret leaks or the unregistered wrapper gets one.
describe("15.02 SEC-07 — replaced Map/Proxy constructors cannot leak secrets or forge grants", () => {
   it("holds authorization and denial when Map/Proxy are replaced at config time", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs", "config"], {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 10_000,
         env: {
            PATH: process.env.PATH,
            ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
            DATABASE_URL: "fake-hardening-database",
            PRIVATE_KEY: "fake-hardening-private-key",
         },
      });
      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-database");
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-private-key");
      expect(result.status, result.stderr).toBe(0);
      expect(result.stderr).toBe("");
      expect(JSON.parse(result.stdout)).toEqual({
         authorizedCallSucceeded: true,
         ambientReadDenied: true,
         hookActive: true,
         forgedGrantDelivered: false,
      });
   });
});
