import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { environment } from "../test-environment.js";

describe("13 — Import-time reader call", () => {
   it("rejects wrapper calls before real configuration registration completes", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs"], {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 15_000,
         env: environment,
      });

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("wrapped functions cannot run while configuration is loading");
      expect(result.stdout).toBe("");
      expect(result.stderr).not.toContain(environment.DATABASE_URL);
   });
});
