import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// Attack: hostile security-event observers try to steal a secret value from the
// event, do a nested protected read, mutate the event, throw, and return a
// rejecting thenable. The library must keep events value-free, keep denial in
// force, contain the misbehavior, and not crash. Any secret value obtained, any
// denial failure, or a process crash fails this test (red).
describe("15.10 SEC-13 — hostile telemetry observers cannot steal secrets or break denial", () => {
   it("contains observer misbehavior with no value leak and denial intact", () => {
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
      // No secret value anywhere, even with hostile observers and stderr paths.
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-database");
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-private-key");
      // Process survived the throwing/rejecting observers.
      expect(result.status, result.stderr).toBe(0);

      const line = result.stdout.split("\n").find((l) => l.trim().startsWith("{"));
      const observed = JSON.parse(line ?? "{}");
      expect(observed.triggerDenied).toBe(true); // event fired from a real denial
      expect(observed.hostileSawValue).toBe(false); // event carried no secret value
      expect(observed.hostileNestedReadDenied).toBe(true); // nested read stayed denied
      expect(observed.secondSubscriberDelivered).toBe(true); // other subscribers still notified
      expect(observed.secondSubscriberSecretName).toBe("PRIVATE_KEY"); // name only
      expect(observed.stillDenied).toBe(true); // denial holds after all misbehavior
   });
});
