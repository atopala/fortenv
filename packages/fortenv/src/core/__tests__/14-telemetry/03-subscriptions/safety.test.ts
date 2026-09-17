import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

describe("14.03 — Telemetry cannot change authorization", () => {
   it.each(["callback-throws", "rejected-promise", "recursive", "async-recursive", "enumerates"])(
      "keeps denying reads and avoids telemetry crashes for %s",
      (mode) => {
         const result = spawnSync(
            process.execPath,
            [fileURLToPath(new URL("./sink-failure.mjs", import.meta.url)), mode],
            {
               encoding: "utf8",
               timeout: 10_000,
               env: {
                  PATH: process.env.PATH,
                  ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
               },
            },
         );
         expect(result.error).toBeUndefined();
         expect(result.signal).toBeNull();
         expect(result.status, result.stderr).toBe(0);
         expect(result.stdout).toBe("ok\n");
         expect(result.stderr).not.toContain("fake-sink-secret");
      },
   );
});
