import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { environment } from "../test-environment.js";

describe("13 — Unregistered wrapper", () => {
   // Design sections 14 and 74: unregistered wrappers execute without secret access.
   it("gives no permissions to a second wrapper around the same original function", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs"], {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 15_000,
         env: environment,
      });

      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("ok\n");
      expect(result.stderr).not.toContain(environment.DATABASE_URL);
   });

   it("keeps the caller's injection unchanged across nested unregistered calls and awaits", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "nested.mjs"], {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 15_000,
         env: environment,
      });

      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("ok\n");
      expect(result.stderr).not.toContain(environment.DATABASE_URL);
   });
});
