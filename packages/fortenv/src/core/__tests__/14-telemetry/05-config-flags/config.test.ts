import { describe, expect, it } from "vitest";

import { defineConfig } from "../../../../config.js";

describe("14.05 — Telemetry configuration flags", () => {
   it.each([
      ["omitted telemetry", {}],
      ["empty telemetry", { telemetry: {} }],
      ["enumeration only", { telemetry: { enumeration: true } }],
      ["stderr fallback only", { telemetry: { stderrFallback: true } }],
      ["both disabled", { telemetry: { enumeration: false, stderrFallback: false } }],
      ["enumeration enabled", { telemetry: { enumeration: true, stderrFallback: false } }],
      ["fallback enabled", { telemetry: { enumeration: false, stderrFallback: true } }],
      ["both enabled", { telemetry: { enumeration: true, stderrFallback: true } }],
   ])("accepts %s without replacing the caller's configuration", (_name, options) => {
      const config = { secrets: { DATABASE_URL: [] }, ...options };
      expect(defineConfig(config)).toBe(config);
   });

   it.each(
      ["enumeration", "stderrFallback"].flatMap((flag) => ["true", 1, null, [], {}].map((value) => ({ flag, value }))),
   )("rejects non-boolean $flag=$value at defineConfig", ({ flag, value }) => {
      const config = { secrets: {}, telemetry: { [flag]: value } };
      expect(() => Reflect.apply(defineConfig, undefined, [config])).toThrow(
         new RegExp(`telemetry.*${flag}.*boolean`, "i"),
      );
   });

   it.each([null, [], "enabled", 1])("rejects a non-object telemetry value: %j", (telemetry) => {
      expect(() => Reflect.apply(defineConfig, undefined, [{ secrets: {}, telemetry }])).toThrow(/telemetry.*object/i);
   });
});
