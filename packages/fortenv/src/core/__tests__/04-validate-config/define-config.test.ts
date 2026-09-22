import { describe, expect, it } from "vitest";

import { defineConfig } from "../../../config.js";
import { fortenv } from "../../runtime.js";

describe("04 — defineConfig parameters", () => {
   it("accepts valid computed values and returns the original config", () => {
      const read = fortenv.string(() => undefined);
      const name = "DATABASE_URL";
      const createConfig = () => ({ secrets: { [name]: [read] } });
      const config = createConfig();

      expect(defineConfig(config)).toBe(config);
      expect(defineConfig(config).secrets[name]?.[0]).toBe(read);
   });

   it("accepts empty policies and empty grant lists", () => {
      expect(defineConfig({ secrets: {} })).toEqual({ secrets: {} });
      expect(defineConfig({ secrets: { DATABASE_URL: [] } })).toEqual({ secrets: { DATABASE_URL: [] } });
   });

   it.each([
      ["undefined config", undefined, /configuration.*object/i],
      ["null config", null, /configuration.*object/i],
      ["array config", [], /configuration.*object/i],
      ["missing secrets", {}, /secrets/i],
      ["null secrets", { secrets: null }, /secrets.*object/i],
      ["array secrets", { secrets: [] }, /secrets.*object/i],
      ["non-array grants", { secrets: { DATABASE_URL: 42 } }, /grants.*array/i],
      ["non-function grant", { secrets: { DATABASE_URL: [42] } }, /only functions/i],
      ["empty secret name", { secrets: { "": [] } }, /secret names must be nonempty/i],
   ] as const)("rejects %s at the defineConfig call", (_name, config, diagnostic) => {
      // JavaScript callers can pass values that the TypeScript signature disallows.
      expect(() => Reflect.apply(defineConfig, undefined, [config])).toThrow(diagnostic);
   });
});
