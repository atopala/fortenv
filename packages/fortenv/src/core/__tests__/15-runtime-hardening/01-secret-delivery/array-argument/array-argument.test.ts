import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("15.01 SEC-08 — argument-array hooks cannot observe injected secrets", () => {
   it.each(["config", "runtime"])(
      "keeps the secret object off attacker array hooks when installed during %s",
      (mode) => {
         const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs", mode], {
            cwd: new URL(".", import.meta.url),
            encoding: "utf8",
            timeout: 10_000,
            env: {
               PATH: process.env.PATH,
               ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
               DATABASE_URL: "fake-hardening-database",
               PRIVATE_KEY: "fake-hardening-private-key",
            },
         });
         expect(result.error).toBeUndefined();
         expect(result.signal).toBeNull();
         expect(result.stdout + result.stderr).not.toContain("fake-hardening-database");
         expect(result.stdout + result.stderr).not.toContain("fake-hardening-private-key");
         expect(result.status, result.stderr).toBe(0);
         expect(result.stderr).toBe("");
         expect(JSON.parse(result.stdout)).toEqual({
            hookActive: true,
            authorizedCallSucceeded: true,
            ambientReadDenied: true,
            intercepted: false,
         });
      },
   );
});
