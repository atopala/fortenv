import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("14.06 — Configurable environment enumeration reports", () => {
   it.each(
      [
         { policy: "enabled", observer: true },
         { policy: "disabled", observer: true },
         { policy: "omitted", observer: true },
         { policy: "enabled", observer: false },
      ].flatMap((options) =>
         ["keys", "values", "entries", "reflect", "spread", "json", "for-in"].map((operation) => ({
            ...options,
            operation,
         })),
      ),
   )(
      "$policy: $operation scans, observer=$observer, during import and authorized execution",
      ({ policy, operation, observer }) => {
         const args = observer ? ["--import", "../04-bootstrap/observe.mjs"] : [];
         args.push("--import", "fortenv/register", "app.mjs", operation);
         const before = Date.now();
         const result = spawnSync(process.execPath, args, {
            cwd: new URL(".", import.meta.url),
            encoding: "utf8",
            timeout: 15_000,
            env: {
               PATH: process.env.PATH,
               ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
               NODE_ENV: "production",
               DATABASE_URL: "fake-enumeration-secret",
               FORTENV_CONFIG: `${policy}.config.mjs`,
            },
         });
         expect(result.error).toBeUndefined();
         expect(result.signal).toBeNull();
         expect(result.status, result.stderr).toBe(0);
         expect(result.stderr).toBe("");
         expect(result.stdout).not.toContain("fake-enumeration-secret");
         const lines = result.stdout.trim().split("\n");
         expect(lines.at(-1)).toBe("ok");
         const events = lines
            .filter((line) => line.startsWith("security-event:"))
            .map((line) => JSON.parse(line.slice("security-event:".length)));
         const scans = events.filter((event) => event.name === "fortenv.env.enumerated");
         const reportsEnumeration = policy === "enabled" && observer;
         expect(scans).toHaveLength(reportsEnumeration ? 2 : 0);
         // The first report must occur inside the config dependency's top-level scan.
         // A late policy installation or buffered publication cannot satisfy this order.
         expect(
            lines.map((line) =>
               line.startsWith("security-event:") ? JSON.parse(line.slice("security-event:".length)).name : line,
            ),
         ).toEqual([
            "scan:import:before",
            ...(reportsEnumeration ? ["fortenv.env.enumerated"] : []),
            "scan:import:after",
            "scan:authorized:before",
            ...(reportsEnumeration ? ["fortenv.env.enumerated"] : []),
            "scan:authorized:after",
            ...(observer ? ["fortenv.access.denied"] : []),
            "ok",
         ]);
         for (const event of scans) {
            expect(event).toMatchObject({ version: 1, operation: "ownKeys", severity: "warn" });
            expect(event).not.toHaveProperty("secret");
            expect(event).not.toHaveProperty("environment");
            expect(event.error.stack).toContain("scanEnvironment");
            expect(event.error.stack).toContain("readers.mjs:");
            expect(event.timestamp).toBeGreaterThanOrEqual(before);
            expect(event.timestamp).toBeLessThanOrEqual(Date.now());
         }
         expect(events.filter((event) => event.name === "fortenv.access.denied")).toHaveLength(observer ? 1 : 0);
      },
   );
});
