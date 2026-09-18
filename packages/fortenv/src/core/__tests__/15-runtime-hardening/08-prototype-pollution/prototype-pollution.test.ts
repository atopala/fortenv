import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("15.08 SEC-18 — prototype pollution cannot leak secrets or forge grants", () => {
   it.each(["objectData", "arrayIndex"])(
      "keeps injection and grants clean when prototypes are polluted (%s)",
      (vector) => {
         const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs", vector], {
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
            authorizedCallSucceeded: true,
            ambientReadDenied: true,
            pollutionActive: true,
            injectionExpanded: false,
            forgedGrantDelivered: false,
         });
      },
   );
});
