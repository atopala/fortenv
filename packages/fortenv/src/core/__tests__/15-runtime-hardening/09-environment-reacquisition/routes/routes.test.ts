import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// SEC-16: every route that resolves to the process environment after bootstrap
// must be the guarded object and deny the protected read — process.env,
// globalThis.process.env, require("node:process").env, and import { env }. A
// spawned child must not inherit the protected value (scrubbed at capture). The
// test fails if any route leaks the secret or a child inherits it.
describe("15.09 SEC-16 — no environment re-acquisition route reveals a protected secret", () => {
   it("denies the protected read on every env route and keeps it out of a child env", () => {
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
      expect(observed.allRoutesDenied).toBe(true);
      expect(observed.anyRouteLeaked).toBe(false);
      // Every listed route individually denied.
      for (const route of observed.routes) expect(route.denied, route.label).toBe(true);
      // A child process does not inherit the scrubbed protected value.
      expect(observed.childSawSecret).toBe(false);
   });
});
