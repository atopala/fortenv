import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// Attack: neutralize the Array.prototype.some membership predicate that
// bootstrap.matchingNames uses, then present a real config whose secret set
// differs from discovery (adds PRIVATE_KEY granted to an attacker wrapper).
//
// matchingNames is layered: it checks size, then membership (.some), then
// case-uniqueness. Neutralizing only the membership predicate does not bypass the
// guard — the size check catches the count mismatch first — so bootstrap fails
// closed before the application runs and no secret leaks. This proves the
// determinism guard does not rely on a single tamperable operation, and the
// undiscovered PRIVATE_KEY (never captured) is never delivered.
describe("15.03 SEC-09 — tampering the name-comparison predicate cannot admit a smuggled secret", () => {
   it("fails closed on a mismatched config and leaks no secret", () => {
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
      // No secret value in any output.
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-database");
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-private-key");

      if (result.stdout.includes("APP_STARTED")) {
         // If bootstrap somehow reached the app, the smuggled wrapper must still
         // have received no secret (the undiscovered name was never captured).
         const line = result.stdout.split("\n").find((l) => l.trim().startsWith("{"));
         const observed = JSON.parse(line ?? "{}");
         expect(observed.smuggledSawSecret).toBe(false);
      } else {
         // Expected: fails closed at bootstrap before the app runs.
         expect(result.status, result.stdout + result.stderr).not.toBe(0);
         expect(result.stderr).toContain("FORTENV_CONFIG_INVALID");
      }
   });
});
