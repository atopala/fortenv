import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { environment } from "../test-environment.js";

describe("13 — Failed config import", () => {
   it("keeps captured secrets scrubbed when the real configuration import throws", () => {
      // The application imports register itself so it can catch and inspect the failure.
      const result = spawnSync(process.execPath, ["app.mjs"], {
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
