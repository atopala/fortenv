import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("15.04 SEC-10 — replaced Set.has cannot disable environment protection", () => {
   it("continues denying protected reads and writes and hiding the protected name", () => {
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
         accessDenied: true,
         readReturned: false,
         writeDenied: true,
         protectedNameEnumerated: false,
      });
   });
});
