import { describe, expect, it } from "vitest";

import { injectSecrets } from "../../injection.js";

describe("12 — Inject only configured secrets", () => {
   const values = new Map<string, string | undefined>([
      ["A", "fake-a"],
      ["B", "fake-b"],
      ["MISSING", undefined],
   ]);
   it("copies only grants, distinguishing missing values from ungranted keys", () => {
      const secrets = injectSecrets(new Set(["A", "MISSING"]), values);
      expect(Object.keys(secrets)).toEqual(["A", "MISSING"]);
      expect(Object.hasOwn(secrets, "MISSING")).toBe(true);
      expect(secrets.MISSING).toBeUndefined();
      expect(Object.hasOwn(secrets, "B")).toBe(false);
      expect(secrets.B).toBeUndefined();
      expect(secrets.A).toBe("fake-a");
   });
   it("returns a frozen null-prototype object with no inherited properties", () => {
      const secrets = injectSecrets(new Set(["A"]), values);
      expect(Object.getPrototypeOf(secrets)).toBeNull();
      expect(Object.isFrozen(secrets)).toBe(true);
      expect(Reflect.set(secrets, "A", "replacement")).toBe(false);
      expect(Reflect.deleteProperty(secrets, "A")).toBe(false);
      expect(Reflect.defineProperty(secrets, "B", { value: "forged" })).toBe(false);
      expect(secrets.toString).toBeUndefined();
      expect(values.get("A")).toBe("fake-a");
   });
   it("gives unregistered wrappers an empty object, never the complete store", () => {
      expect(Object.keys(injectSecrets(new Set(), values))).toEqual([]);
   });
   it("creates independent snapshots and preserves already delivered values", () => {
      const store = new Map([["A", "original"]]);
      const first = injectSecrets(new Set(["A"]), store);
      const second = injectSecrets(new Set(["A"]), store);
      expect(first).not.toBe(second);
      store.set("A", "changed");
      expect(first.A).toBe("original");
      expect(second.A).toBe("original");
   });
   it("treats prototype-related names as ordinary configured data", () => {
      const names = ["__proto__", "constructor", "toString"];
      const secrets = injectSecrets(new Set(names), new Map(names.map((name) => [name, "fake-" + name])));
      expect(Object.keys(secrets)).toEqual(names);
      expect(secrets.__proto__).toBe("fake-__proto__");
      expect(Object.getPrototypeOf(secrets)).toBeNull();
   });
   it("normalizes lookup while preserving the configuration spelling of injected keys", () => {
      const secrets = injectSecrets(new Set(["database_url"]), new Map([["DATABASE_URL", "fake-db"]]), (name) =>
         name.toUpperCase(),
      );
      expect(Object.keys(secrets)).toEqual(["database_url"]);
      expect(secrets.database_url).toBe("fake-db");
      expect(secrets.DATABASE_URL).toBeUndefined();
   });
});
