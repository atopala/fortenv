import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// AGGRESSIVE attack: fully-functional-but-malicious Map and Proxy that keep the
// app working while actively siphoning every key, value, and handler argument —
// including intercepting the wrapper's own apply trap to try to grab the injected
// secrets object as it flows to the callback. The test fails if the harvest ever
// captures a real secret value.
describe("15.02 SEC-07/08 — a siphoning Map/Proxy cannot capture the injected secret", () => {
   it("keeps the secret out of the attacker's harvest even while wrapping the apply trap", () => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs", "config"], {
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
      expect(observed.hookActive).toBe(true); // malicious Map+Proxy installed and used
      expect(observed.applyTrapArgsSeen).toBeGreaterThan(0); // attacker DID intercept the apply trap
      // The core assertion: despite intercepting the apply trap, no secret captured.
      expect(observed.harvestedSecret).toBe(false);
      expect(observed.harvestSize).toBe(0);
   });
});
