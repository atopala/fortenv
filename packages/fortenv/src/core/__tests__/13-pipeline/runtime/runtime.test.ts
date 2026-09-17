import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("13 — Runtime integration", () => {
   it("injects independent grants across nested and concurrent calls while helpers and detached reads remain denied", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs"], {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 10_000,
         env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, SECRET_A: "fake-a", SECRET_B: "fake-b" },
      });
      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("ok\n");
   });
});
