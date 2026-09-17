import { describe, expect, it } from "vitest";

import { defineConfig } from "../../../config.js";
import { createMockLoader } from "../../mock-imports.js";

describe("06 — Mock imports", () => {
   it("returns the real validating helper only for fortenv/config", () => {
      const load = createMockLoader(new WeakSet());
      const namespace = load("fortenv/config").namespace;
      expect(Reflect.get(namespace, "defineConfig")).toBe(defineConfig);
      expect(Object.isFrozen(namespace)).toBe(true);
      const config = { secrets: {} };
      expect(defineConfig(config)).toBe(config);
   });

   it("creates placeholders without resolving even a nonexistent dependency", () => {
      const placeholders = new WeakSet<Function>();
      const load = createMockLoader(placeholders);
      const namespace = load("./does-not-exist.mjs").namespace;
      const read = Reflect.get(namespace, "read");
      expect(typeof read).toBe("function");
      expect(placeholders.has(read)).toBe(true);
      // Compare identity before handing the result to Vitest: namespace.then is mocked too.
      expect(load("./does-not-exist.mjs").namespace === namespace).toBe(true);
      expect(Reflect.get(namespace, "read") === read).toBe(true);
      expect(Reflect.get(namespace, "other") === read).toBe(false);
      expect(Reflect.get(load("./another.mjs").namespace, "read") === read).toBe(false);
   });

   it("rejects attempts to invoke, construct, inspect, or mutate a placeholder", () => {
      const load = createMockLoader(new WeakSet());
      const namespace = load("./reader.mjs").namespace;
      const read = Reflect.get(namespace, "read");
      expect(() => read()).toThrow("only be used as grant references");
      expect(() => Reflect.construct(read, [])).toThrow("only be used as grant references");
      expect(() => Reflect.get(read, "property")).toThrow("only be used as grant references");
      expect(() => Reflect.set(read, "property", 1)).toThrow("only be used as grant references");
      expect(() => Reflect.set(namespace, "read", () => undefined)).toThrow("read-only");
   });

   it("awaits the loader envelope without calling an export named then", async () => {
      const placeholders = new WeakSet<Function>();
      const load = createMockLoader(placeholders);
      const result = await load("./then-reader.mjs");
      expect(placeholders.has(Reflect.get(result.namespace, "then"))).toBe(true);
      expect(result.namespace === load("./then-reader.mjs").namespace).toBe(true);
   });
});
