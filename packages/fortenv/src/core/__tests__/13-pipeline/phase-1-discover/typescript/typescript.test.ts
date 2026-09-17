import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { discoverSecrets } from "../../../../discovery.js";

describe("13 — TypeScript discovery", () => {
   it.each(["plain.config.ts", "plain.config.mts", "type-imports.config.ts", "satisfies.config.mts"])(
      "discovers names through native type-strippable TypeScript: %s",
      async (filename) => {
         const file = new URL(filename, import.meta.url);
         const result = await discoverSecrets(readFileSync(file, "utf8"), fileURLToPath(file));
         expect([...result.keys()]).toEqual(["DATABASE_URL"]);
         expect(result.get("DATABASE_URL")).toHaveLength(1);
         expect(typeof result.get("DATABASE_URL")![0]).toBe("function");
      },
   );
});
