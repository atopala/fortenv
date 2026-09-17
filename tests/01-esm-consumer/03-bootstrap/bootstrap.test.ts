import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("ESM consumer bootstrap boundaries", () => {
   function run(app: string, preload = true, config?: string) {
      const result = spawnSync(process.execPath, [...(preload ? ["--import", "fortenv/register"] : []), app], {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 15_000,
         env: {
            PATH: process.env.PATH,
            ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
            DATABASE_URL: "fake-module-secret",
            ...(config ? { FORTENV_CONFIG: config } : {}),
         },
      });
      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      expect(result.stdout + result.stderr).not.toContain("fake-module-secret");
      return result;
   }
   it("rejects wrapper calls when preload is missing", () => {
      const result = run("missing-preload.js", false);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("ok\n");
      expect(result.stderr).toBe("");
   });
   it("rejects wrapper calls before real config registration", () => {
      const result = run("app-not-started.js", true, "./early.config.mjs");
      expect(result.status, result.stderr).toBe(1);
      expect(result.stdout).toBe("before-early-call\n");
      expect(result.stderr).toContain("wrapped functions cannot run while configuration is loading");
   });
   it("gives unregistered wrappers an empty injection after bootstrap", () => {
      const result = run("unregistered.js");
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("ok\n");
      expect(result.stderr).toBe("");
   });
});
