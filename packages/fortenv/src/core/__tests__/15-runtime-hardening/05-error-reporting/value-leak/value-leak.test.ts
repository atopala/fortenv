import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// SEC-22: no error message, stack, telemetry event, validation string, or any
// other diagnostic output may embed a secret VALUE. Names may appear where
// documented; values may not.
describe("15.05 SEC-22 — no diagnostic path leaks a secret value", () => {
   it("keeps fake values out of every error, stack, event, and validation message", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs"], {
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
      expect(result.status, result.stderr).toBe(0);

      const combined = result.stdout + result.stderr;
      // The core assurance: neither secret value appears anywhere.
      expect(combined).not.toContain("fake-hardening-database");
      expect(combined).not.toContain("fake-hardening-private-key");

      const line = result.stdout.split("\n").find((l) => l.trim().startsWith("{"));
      const observed = JSON.parse(line ?? "{}");
      // Positive controls: the diagnostic paths actually ran and disclose the NAME.
      expect(observed.deniedName).toBe("PRIVATE_KEY");
      expect(observed.deniedMessage).toContain("PRIVATE_KEY");
      expect(observed.mutationMessage).toContain("DATABASE_URL");
      expect(observed.enumeratedKeysHidePrivate).toBe(true);
      expect(typeof observed.validationMessage).toBe("string");
   });
});
