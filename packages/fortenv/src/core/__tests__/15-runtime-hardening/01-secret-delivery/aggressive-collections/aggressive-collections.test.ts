import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// AGGRESSIVE attack: fully-functional-but-malicious Set iterator and Map.get that
// keep the app working while harvesting every value they touch, aimed at the
// injection path (grant-name Set iteration + private value Map reads). The test
// fails if the harvest captures a real secret value.
describe("15.01 SEC-03/06 — siphoning Set/Map methods cannot capture the injected secret", () => {
   it("routes injection through captured intrinsics so the harvest stays empty", () => {
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
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-database");
      expect(result.stdout + result.stderr).not.toContain("fake-hardening-private-key");
      expect(result.status, result.stderr).toBe(0);

      const line = result.stdout.split("\n").find((l) => l.trim().startsWith("{"));
      const observed = JSON.parse(line ?? "{}");
      expect(observed.authorizedCallSucceeded).toBe(true); // app still works
      expect(observed.hookActive).toBe(true); // malicious methods provably live
      // The core assertion: no secret captured. (Fortenv routes injection through
      // captured intrinsics, so it never even calls these replaced prototype
      // methods — ranDuringInjection is false — which is why the harvest is empty.)
      expect(observed.harvestedSecret).toBe(false);
      expect(observed.harvestSize).toBe(0);
      expect(observed.ranDuringInjection).toBe(false);
   });
});
