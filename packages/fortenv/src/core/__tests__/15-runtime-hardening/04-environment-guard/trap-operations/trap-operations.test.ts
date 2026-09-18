import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// Attack: after bootstrap, replace the global operations the env-guard traps use
// internally (Reflect.get, Reflect.ownKeys, Array.prototype.filter) and try to
// make a protected read return a value or leak a protected name in enumeration.
// The test fails if denial stops holding or any protected name/value surfaces.
describe("15.04 SEC-10 — replacing guard-trap operations cannot defeat denial", () => {
   it("keeps protected reads denied and enumeration hiding protected names", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs"], {
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

      const line = result.stdout.split("\n").find((l) => l.trim().startsWith("{"));
      const observed = JSON.parse(line ?? "{}");
      expect(observed.hookActive).toBe(true); // the replacement is installed and active
      expect(observed.protectedReadDenied).toBe(true); // protected read still throws
      expect(observed.protectedReadReturnedSomething).toBe(false); // no value returned
      expect(observed.protectedReadWasAttackerValue).toBe(false); // guard didn't use replaced Reflect.get
      expect(observed.enumerationHidesProtected).toBe(true); // protected name stays hidden
      expect(observed.authorizedStillWorks).toBe(true); // normal path intact
   });
});
