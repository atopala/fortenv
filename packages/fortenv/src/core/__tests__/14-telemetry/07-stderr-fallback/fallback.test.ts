import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("14.07 — Optional stderr fallback", () => {
   it.each([
      ["omitted", "caught", false],
      ["omitted", "caught", true],
      ["disabled", "caught", false],
      ["disabled", "caught", true],
      ["enabled", "caught", false],
      ["enabled", "caught", true],
      ["omitted", "uncaught", false],
      ["omitted", "uncaught", true],
      ["disabled", "uncaught", false],
      ["disabled", "uncaught", true],
      ["enabled", "uncaught", false],
      ["enabled", "uncaught", true],
   ] as const)("policy=%s denial=%s observer=%s", (policy, outcome, observer) => {
      const args = observer ? ["--import", "../04-bootstrap/observe.mjs"] : [];
      args.push("--import", "fortenv/register", "../04-bootstrap/app.mjs");
      const config = policy === "omitted" ? `../04-bootstrap/${outcome}.config.mjs` : `${policy}-${outcome}.config.mjs`;
      const result = spawnSync(process.execPath, args, {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 15_000,
         env: {
            PATH: process.env.PATH,
            ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
            FORTENV_CONFIG: config,
            DATABASE_URL: "fake-fallback-secret",
         },
      });
      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      expect(result.stdout + result.stderr).not.toContain("fake-fallback-secret");
      expect(result.status, result.stdout + result.stderr).toBe(outcome === "caught" ? 0 : 1);

      // Node's uncaught-exception text may coexist with a JSON fallback record.
      const records = result.stderr.split("\n").flatMap((line) => {
         try {
            return [JSON.parse(line)];
         } catch {
            return [];
         }
      });
      const fallback = policy === "enabled" && !observer;
      expect(records).toHaveLength(fallback ? 1 : 0);
      if (fallback) {
         expect(records[0]).toMatchObject({
            version: 1,
            name: "fortenv.access.denied",
            severity: "error",
            operation: "get",
            secret: "DATABASE_URL",
            error: { name: "FortenvAccessError", code: "FORTENV_ACCESS_DENIED" },
         });
         expect(records[0].error.stack).toContain(`${outcome}-reader.mjs:`);
      }
      expect(result.stdout.split("\n").filter((line) => line.startsWith("security-event:"))).toHaveLength(
         observer ? 1 : 0,
      );
      if (outcome === "caught") {
         expect(result.stdout).toContain("denial-caught\napp-started\n");
         if (fallback) {
            // Every stderr line must be the single structured report, not an extra console error.
            const stderrLines = result.stderr.trim().split("\n");
            expect(stderrLines).toHaveLength(1);
            expect(JSON.parse(stderrLines[0]!)).toEqual(records[0]);
         } else {
            expect(result.stderr).toBe("");
         }
      } else {
         expect(result.stdout).not.toContain("app-started");
         expect(result.stderr).toMatch(/Error: Fortenv:.*unauthorized access/);
      }
   });
});
