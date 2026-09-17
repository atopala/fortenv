import { describe, expect, it, vi } from "vitest";

import { readConfiguration, validateSecretName } from "../../configuration.js";
import { readDiscoveryResult } from "../../discovery-result.js";
import { createMockLoader } from "../../mock-imports.js";

describe("08 — Validate and extract secrets", () => {
   it("extracts exact secret names and preserves placeholder identity", () => {
      const placeholders = new WeakSet<Function>();
      const loader = createMockLoader(placeholders);
      const read = Reflect.get(loader("./reader.mjs").namespace, "read");
      const entries = readDiscoveryResult(
         { secrets: { DATABASE_URL: [read], "MY-SECRET": [], MISSING: [read] } },
         placeholders,
      );
      expect([...entries.keys()]).toEqual(["DATABASE_URL", "MY-SECRET", "MISSING"]);
      expect(entries.get("DATABASE_URL")?.[0]).toBe(read);
      expect(entries.get("MY-SECRET")).toEqual([]);
   });

   it("copies input arrays so subsequent config mutation cannot change the policy", () => {
      const reader = () => undefined;
      const functions = [reader];
      const config = { secrets: { DATABASE_URL: functions } };
      const entries = readConfiguration(config);
      functions.length = 0;
      Reflect.deleteProperty(config.secrets, "DATABASE_URL");
      expect(entries.get("DATABASE_URL")).toEqual([reader]);
   });

   it("rejects a real function masquerading as a discovery placeholder", () => {
      expect(() => readDiscoveryResult({ secrets: { DATABASE_URL: [() => undefined] } }, new WeakSet())).toThrow(
         "grant references must come from imported modules",
      );
   });

   it.each([
      ["null config", null],
      ["array config", []],
      ["missing secrets", {}],
      ["extra property", { secrets: {}, extra: true }],
      ["null secrets", { secrets: null }],
      ["array secrets", { secrets: [] }],
      ["non-array grants", { secrets: { DATABASE_URL: {} } }],
      ["non-function grant", { secrets: { DATABASE_URL: [1] } }],
      ["sparse grant array", { secrets: { DATABASE_URL: new Array(1) } }],
   ])("rejects %s", (_name, config) => {
      expect(() => readConfiguration(config)).toThrow("Fortenv:");
   });

   it("rejects accessors without executing their getters", () => {
      const getter = vi.fn(() => ({}));
      const config = Object.defineProperty({}, "secrets", { get: getter, enumerable: true });
      expect(() => readConfiguration(config)).toThrow("data properties");
      expect(getter).not.toHaveBeenCalled();
      const grants = Object.defineProperty([undefined], "0", { get: getter });
      expect(() => readConfiguration({ secrets: { DATABASE_URL: grants } })).toThrow("only functions");
      expect(getter).not.toHaveBeenCalled();
   });

   it("rejects hidden, symbol, and non-plain config properties", () => {
      expect(() => readConfiguration(Object.defineProperty({}, "secrets", { value: {} }))).toThrow("enumerable");
      expect(() => readConfiguration({ secrets: {}, [Symbol("hidden")]: {} })).toThrow("string data");
      expect(() => readConfiguration({ secrets: new Date() })).toThrow("plain object");
   });

   it("accepts a null-prototype dictionary and an empty policy", () => {
      expect([...readConfiguration({ secrets: Object.create(null) })]).toEqual([]);
   });

   it.each(["", "A=B", "A\0B", "NEXT_PUBLIC_KEY", "next_public_key"])("rejects invalid secret name %j", (name) => {
      expect(() => validateSecretName(name)).toThrow("Fortenv:");
   });

   it.each(["DATABASE_URL", "MY-SECRET", "密钥"])("accepts secret name %s", (name) => {
      expect(() => validateSecretName(name)).not.toThrow();
   });
});
