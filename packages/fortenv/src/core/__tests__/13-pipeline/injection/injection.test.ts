import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("13 — Explicit injection through the built package", () => {
   function run(app: string, ...args: string[]) {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", app, ...args], {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 10_000,
         env: {
            PATH: process.env.PATH,
            SystemRoot: process.env.SystemRoot,
            DATABASE_URL: "fake-db",
            OTHER_SECRET: "fake-other",
         },
      });
      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("ok\n");
   }
   it("creates a database after preload without giving its constructor ambient access", () => run("factory.mjs"));
   it("preserves return, Promise and error identities and isolates overlapping invocations", () => run("returns.mjs"));
   it.each(["return", "throw", "resolve", "reject"])(
      "retains explicitly captured values after %s without ambient access",
      (outcome) => run("captured.mjs", outcome),
   );
});
