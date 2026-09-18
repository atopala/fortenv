import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// Attack: replace Error.captureStackTrace (made to throw) and Error.stackTraceLimit
// (accessor) at T2, then trigger a denied read. Hardened contract: building a
// FortenvAccessError never throws even if Error.captureStackTrace is replaced
// (stack capture is best-effort), so the denied read still throws a proper
// FortenvAccessError, no secret value leaks, and the process survives.
describe("15.05 SEC-12a — stack-capture tampering cannot break the denial error contract", () => {
   it("still throws FortenvAccessError with no value leak under a throwing captureStackTrace", () => {
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
      // Hard confidentiality assertions.
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-database");
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-private-key");
      expect(result.status, result.stderr).toBe(0);

      const line = result.stdout.split("\n").find((l) => l.trim().startsWith("{"));
      const observed = JSON.parse(line ?? "{}");
      expect(observed.hookActive).toBe(true); // attack active
      expect(observed.deniedThrewSomething).toBe(true); // read still fails closed
      expect(observed.leakedInErrorText).toBe(false); // no secret value in the error/stack
      expect(observed.authorizedStillWorks).toBe(true); // normal path intact
      // Hardened: the denial error contract holds despite the throwing captureStackTrace.
      expect(observed.deniedWithContractError).toBe(true);
   });
});
