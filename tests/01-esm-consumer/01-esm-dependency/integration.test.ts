import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("ESM consumer → ESM dependency", () => {
   function run(app: string, mode?: string, config?: string) {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", app, ...(mode ? [mode] : [])], {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 15_000,
         env: {
            PATH: process.env.PATH,
            ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
            NODE_ENV: "test",
            DATABASE_URL: "fake-module-secret",
            OTHER_SECRET: "fake-other-secret",
            ...(config ? { FORTENV_CONFIG: config } : {}),
         },
      });
      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      expect(result.stdout + result.stderr).not.toContain("fake-module-secret");
      expect(result.stdout + result.stderr).not.toContain("fake-other-secret");
      return result;
   }
   function succeeds(app: string, mode?: string) {
      const result = run(app, mode);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("ok\n");
      expect(result.stderr).toBe("");
   }
   it("injects only configured keys into synchronous and async factories", () => succeeds("happy.js"));
   it.each(["sync", "async"])("denies ambient access inside a %s registered factory's dependency", (mode) =>
      succeeds("denied-read.js", mode),
   );
   it.each(["sync", "async"])("preserves the original %s callback error and keeps protection active", (mode) =>
      succeeds("callback-errors.js", mode),
   );
   it("shares exact wrapper and runtime identities across config, import and require", () => succeeds("identity.js"));
   it("denies dependency import-time access before the application starts", () => {
      const result = run("app-not-started.js", undefined, "./import-time.config.mjs");
      expect(result.status, result.stderr).toBe(1);
      expect(result.stdout).toBe("dependency:before-secret-read\n");
      expect(result.stderr).toContain("FortenvAccessError");
      expect(result.stderr).toContain("FORTENV_ACCESS_DENIED");
      expect(result.stderr).toContain("DATABASE_URL");
      expect(result.stderr).toContain("import-time.js");
   });
});
