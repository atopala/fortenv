import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("14.04 — Telemetry during real config loading", () => {
   it.each(["caught", "uncaught"])("reports %s import-time denial before the application can start", (mode) => {
      const result = spawnSync(
         process.execPath,
         ["--import", "./observe.mjs", "--import", "fortenv/register", "app.mjs"],
         {
            cwd: new URL(".", import.meta.url),
            encoding: "utf8",
            timeout: 15_000,
            env: {
               PATH: process.env.PATH,
               ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
               FORTENV_CONFIG: `${mode}.config.mjs`,
               DATABASE_URL: "fake-bootstrap-telemetry-secret",
            },
         },
      );

      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      expect(result.stdout + result.stderr).not.toContain("fake-bootstrap-telemetry-secret");
      const lines = result.stdout.trim().split("\n");
      const reports = lines.filter((line) => line.startsWith("security-event:"));
      expect(reports, result.stdout + result.stderr).toHaveLength(1);
      const event = JSON.parse(reports[0]!.slice("security-event:".length));
      expect(event).toMatchObject({
         version: 1,
         name: "fortenv.access.denied",
         operation: "get",
         secret: "DATABASE_URL",
         error: { name: "FortenvAccessError", code: "FORTENV_ACCESS_DENIED" },
      });
      expect(event.error.stack).toContain(`${mode}-reader.mjs:`);
      expect(lines[0]).toBe(reports[0]);
      if (mode === "caught") {
         expect(result.status, result.stderr).toBe(0);
         expect(result.stderr).toBe("");
         expect(lines.slice(1)).toEqual(["denial-caught", "app-started"]);
      } else {
         expect(result.status).toBe(1);
         expect(lines).toEqual(reports);
         expect(result.stderr).toContain("unauthorized access");
      }
   });
});
