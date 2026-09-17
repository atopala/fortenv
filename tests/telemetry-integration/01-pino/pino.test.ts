import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("01 — Built Fortenv with real Pino", () => {
   it.each(["root", "child"])(
      "serializes errors and warnings through a %s logger and restores fallback after disconnect",
      (mode) => {
         const result = spawnSync(process.execPath, ["--import", "fortenv/register", "01-pino/app.mjs", mode], {
            cwd: new URL("..", import.meta.url),
            encoding: "utf8",
            timeout: 15_000,
            env: {
               PATH: process.env.PATH,
               ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
               DATABASE_URL: "fake-integration-secret",
            },
         });
         expect(result.error).toBeUndefined();
         expect(result.signal).toBeNull();
         expect(result.status, result.stderr).toBe(0);
         expect(result.stdout).toBe("ok\n");
         expect(result.stderr).not.toContain("fake-integration-secret");
         const lines = result.stderr.trim().split("\n");
         expect(lines).toHaveLength(1);
         expect(JSON.parse(lines[0]!)).toMatchObject({ name: "fortenv.access.denied", secret: "DATABASE_URL" });
      },
   );
});
