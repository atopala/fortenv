import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("15.03 SEC-08/SEC-09 — replaced array operations cannot add config targets", () => {
   it.each(["push", "iterator"])("does not grant DATABASE_URL through replaced Array %s", (mode) => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs", mode], {
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
         authorizedCallSucceeded: true,
         forgedGrantDelivered: false,
         ambientReadDenied: true,
      });
   });
});
