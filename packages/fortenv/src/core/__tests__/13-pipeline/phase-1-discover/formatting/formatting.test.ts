import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { discoverSecrets } from "../../../../discovery.js";

describe("13 — Discovery source formatting", () => {
   it.each([
      ["comments.config.mjs", ["DATABASE_URL"]],
      ["multiline.config.mjs", ["DATABASE_URL", "STRIPE_SECRET_KEY"]],
      ["string-keys.config.mjs", ["MY-SPECIAL-SECRET", "TOKEN_2", "import export secrets", "密钥"]],
      ["unicode-binding.config.mjs", ["DATABASE_URL"]],
      ["escaped-binding.config.mjs", ["DATABASE_URL"]],
   ])("parses declarative syntax without confusing source text with imports or keys: %s", async (filename, names) => {
      const file = new URL(filename, import.meta.url);
      const result = await discoverSecrets(readFileSync(file, "utf8"), fileURLToPath(file));
      expect([...result.keys()]).toEqual(names);
   });
});
