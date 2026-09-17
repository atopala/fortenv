import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { stripConfigTypes } from "../../typescript.js";

describe("03 — Strip TypeScript", () => {
   it.each(["typed.config.ts", "typed.config.mts"])("strips %s into inspectable JavaScript", async (filename) => {
      const source = readFileSync(new URL(filename, import.meta.url), "utf8");
      await expect(stripConfigTypes(source, filename)).toMatchFileSnapshot(`./__snapshots__/${filename}.mjs`);
   });

   it.each(["plain.config.js", "plain.config.mjs"])("preserves %s byte for byte", (filename) => {
      const source = readFileSync(new URL(filename, import.meta.url), "utf8");
      expect(stripConfigTypes(source, filename)).toBe(source);
   });

   it("rejects TypeScript that requires runtime transformation", () => {
      const source = readFileSync(new URL("./enum.config.ts", import.meta.url), "utf8");
      expect(() => stripConfigTypes(source, "enum.config.ts")).toThrow(/enum|strip.only/i);
   });
});
