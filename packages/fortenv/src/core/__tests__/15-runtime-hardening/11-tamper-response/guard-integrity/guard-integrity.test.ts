import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// EXPLORATORY TEST — validating assumptions about the current library, not a
// regression against an agreed tamper-response contract (SEC-23/SEC-24 behavior
// is still pending design review). It attempts to replace / redefine / delete /
// bypass the installed process.env guard via ordinary post-bootstrap JS and
// records what happens. The only hard assertions are the confidentiality
// invariants we are already committed to: no secret VALUE leaks, and a protected
// read is still denied after every attempt. The per-attempt outcomes are logged
// for human review to decide whether any new enforcement is warranted.
describe("15.11 SEC-23/24 (exploratory) — process.env guard integrity under tampering", () => {
   it("keeps protected reads denied and leaks no value across guard-tamper attempts", () => {
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

      // Confidentiality invariant: no secret value anywhere, regardless of outcome.
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-database");
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-private-key");

      const line = result.stdout.split("\n").find((l) => l.trim().startsWith("{"));
      const observed = JSON.parse(line ?? "{}");

      // The guard must still deny protected reads after every attempt.
      expect(observed.finalDenied).toBe(true);
      for (const entry of observed.results) {
         expect(entry.deniedAfter, `denial held after ${entry.name}`).toBe(true);
      }
   });
});
