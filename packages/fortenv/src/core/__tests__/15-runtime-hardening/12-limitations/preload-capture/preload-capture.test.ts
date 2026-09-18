import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// SEC-17 (documented limitation control): a module imported BEFORE fortenv/register
// reads the secret from the unguarded environment. This is an architectural
// limitation (design §3/§4/§18), not a bug and not fixable in V1 — Fortenv is
// defense-in-depth for code that loads after it, not a same-process sandbox or a
// guard against pre-load access. This test documents the boundary: the pre-load
// read succeeds (limitation), while the post-load ambient read is denied
// (guarantee). It never prints the secret value.
describe("15.12 SEC-17 — pre-load access is a documented limitation, post-load reads stay denied", () => {
   it("shows the T0 boundary: pre-load read matches, post-load read denied", () => {
      const preload = new URL("./preload-capture.mjs", import.meta.url);
      const result = spawnSync(
         process.execPath,
         ["--import", preload.href, "--import", "fortenv/register", "app.mjs"],
         {
            cwd: new URL(".", import.meta.url),
            encoding: "utf8",
            timeout: 10_000,
            env: {
               PATH: process.env.PATH,
               ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
               DATABASE_URL: "fake-hardening-database",
               PRIVATE_KEY: "fake-hardening-private-key",
            },
         },
      );
      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      // Even documenting the limitation, the raw value must not be printed.
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-database");
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-private-key");
      expect(result.status, result.stderr).toBe(0);

      const line = result.stdout.split("\n").find((l) => l.trim().startsWith("{"));
      const observed = JSON.parse(line ?? "{}");
      // The documented limitation: code loaded before Fortenv sees the raw value.
      expect(observed.preloadReadMatched).toBe(true);
      // The guarantee: after Fortenv loads, the same ambient read is denied.
      expect(observed.postLoadAmbientReadDenied).toBe(true);
   });
});
