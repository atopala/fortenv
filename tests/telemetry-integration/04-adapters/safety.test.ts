import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("04 — Adapter failure isolation", () => {
   it.each(["pino", "opentelemetry"])("keeps denying access when %s throws", (adapter) => {
      const result = spawnSync(
         process.execPath,
         ["--import", "fortenv/register", "04-adapters/sink-failure.mjs", adapter],
         {
            cwd: new URL("..", import.meta.url),
            encoding: "utf8",
            timeout: 15_000,
            env: {
               PATH: process.env.PATH,
               ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
               DATABASE_URL: "fake-integration-secret",
            },
         },
      );
      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("ok\n");
      expect(result.stderr).toBe("");
   });
});
