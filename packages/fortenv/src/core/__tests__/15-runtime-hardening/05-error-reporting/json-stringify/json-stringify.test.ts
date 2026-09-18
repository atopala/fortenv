import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("15.05 SEC-12 — replaced JSON.stringify cannot replace denial errors", () => {
   it("preserves access and mutation errors after runtime replacement", () => {
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
      expect(result.stderr).toBe("");
      expect(JSON.parse(result.stdout)).toEqual({
         hookActive: true,
         hookTargetReached: false,
         accessDenied: true,
         mutationDenied: true,
         replacementErrorObserved: false,
      });
   });
});
