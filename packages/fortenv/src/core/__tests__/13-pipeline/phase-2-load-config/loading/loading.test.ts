import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { environment } from "../test-environment.js";

describe("13 — Real config loading", () => {
   it.each(["ts", "mts", "js", "mjs"])(
      "protects imports and registers real wrappers from a .%s config",
      (extension) => {
         const result = spawnSync(process.execPath, ["--import", "./early.mjs", "app.mjs"], {
            cwd: new URL(".", import.meta.url),
            encoding: "utf8",
            timeout: 15_000,
            env: { ...environment, FORTENV_CONFIG: `./fortenv.config.${extension}` },
         });

         expect(result.error).toBeUndefined();
         expect(result.status, result.stderr).toBe(0);
         expect(result.stdout).toBe("ok\n");
         expect(result.stderr).not.toContain(environment.DATABASE_URL);
         expect(result.stderr).not.toContain(environment.STRIPE_SECRET_KEY);
      },
   );
});
