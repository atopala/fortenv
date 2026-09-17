import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { environment } from "../test-environment.js";

describe("13 — Real config target validation", () => {
   it.each([
      "raw-function.config.mjs",
      "original-function.config.mjs",
      "bound-wrapper.config.mjs",
      "forged-wrapper.config.mjs",
      "object-target.config.mjs",
   ])("rejects an invalid real grant target before application entry: %s", (filename) => {
      const result = spawnSync(process.execPath, ["--import", "fortenv/register", "app.mjs"], {
         cwd: new URL(".", import.meta.url),
         encoding: "utf8",
         timeout: 15_000,
         env: { ...environment, FORTENV_CONFIG: `./${filename}` },
      });

      expect(result.error).toBeUndefined();
      expect(result.status).not.toBe(0);
      expect(result.signal).toBeNull();
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Fortenv:");
      expect(result.stderr).toContain("DATABASE_URL");
      expect(result.stderr).toMatch(/function|wrapped/i);
      expect(result.stderr).not.toContain("config discovery failed");
      expect(result.stderr).not.toContain(environment.DATABASE_URL);
      expect(result.stderr).not.toContain(environment.STRIPE_SECRET_KEY);
   });
});
