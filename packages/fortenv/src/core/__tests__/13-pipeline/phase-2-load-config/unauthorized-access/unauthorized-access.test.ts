import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { environment } from "../test-environment.js";

describe("13 — Unauthorized import-time secret access", () => {
   it("throws on a direct secret read and stops module initialization before the app starts", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs"], {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 15_000,
         env: environment,
      });

      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      expect(result.stdout + result.stderr).not.toContain(environment.DATABASE_URL);
      expect(result.stdout).toContain("before-secret-read\n");
      expect(result.status, result.stdout + result.stderr).toBe(1);
      expect(result.stderr).toMatch(/Error: Fortenv:.*(?:unauthorized|not authorized|access denied)/i);
      expect(result.stderr).toContain("DATABASE_URL");
      expect(result.stdout).toBe("before-secret-read\n");
   });
});
