import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// SEC-14: the public export surface must not expose live private state (captured
// values or the grant registry), must refuse internal dist subpath imports, and
// must offer no grant-installation backdoor. The test fails if any secret value
// is reachable, any internal import resolves, or an attacker wrapper gains a grant.
describe("15.07 SEC-14 — package exports expose no live state or grant backdoor", () => {
   it("keeps private state, internals, and grants off the public surface", () => {
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
      expect(observed.leakFindings).toEqual([]); // no secret value reachable via exports
      expect(observed.resolvedInternalImports).toEqual([]); // internal dist subpaths refused
      expect(observed.attackerGotSecret).toBe(false); // no grant-installation backdoor
      // Root export surface is exactly the intended API.
      expect(observed.rootExports).toEqual([
         "FortenvAccessError",
         "FortenvConfigError",
         "FortenvStateError",
         "FortenvUsageError",
         "fortenv",
      ]);
   });
});
