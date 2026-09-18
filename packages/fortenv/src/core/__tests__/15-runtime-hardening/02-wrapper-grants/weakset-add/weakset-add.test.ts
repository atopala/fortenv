import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("15.02 SEC-05 — WeakSet.prototype.add cannot forge wrapper identity", () => {
   it("rejects a raw target when registration is replaced during config loading", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs", "config"], {
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
      expect(result.status).not.toBe(0);
      expect(result.stdout).not.toContain("APP_STARTED");
      expect(result.stderr).toContain("grant target for");
      expect(result.stderr).toContain("is not wrapped with fortenv()");
   });
});
