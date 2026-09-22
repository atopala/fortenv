import { describe, expect, it } from "vitest";

import { matchingNames } from "../../bootstrap.js";
import { buildGrants } from "../../grants.js";
import { fortenv } from "../../runtime.js";

describe("11 — Register grants", () => {
   it("combines configured grants by exact wrapper identity", () => {
      const original = () => undefined;
      const first = fortenv.string(original);
      const second = fortenv.string(original);
      const wrappers = new WeakSet<Function>([first, second]);
      const entries = new Map([
         ["DATABASE_URL", [first, second]],
         ["STRIPE_SECRET_KEY", [first, first]],
      ]);
      const grants = buildGrants(entries, (fn) => wrappers.has(fn));
      expect([...grants.get(first)!]).toEqual(["DATABASE_URL", "STRIPE_SECRET_KEY"]);
      expect([...grants.get(second)!]).toEqual(["DATABASE_URL"]);
      expect(grants.has(original)).toBe(false);
      expect(grants.has(first.bind(null))).toBe(false);
      entries.clear();
      expect([...grants.get(first)!]).toEqual(["DATABASE_URL", "STRIPE_SECRET_KEY"]);
   });

   it("rejects invalid identities without changing an already-built ACL", () => {
      const reader = fortenv.string(() => undefined);
      const valid = new Map([["DATABASE_URL", [reader]]]);
      const isWrapper = (fn: Function) => fn === reader;
      const grants = buildGrants(valid, isWrapper);
      expect(() => buildGrants(new Map([["DATABASE_URL", [reader, () => undefined]]]), isWrapper)).toThrow(
         "not wrapped with fortenv()",
      );
      expect([...grants.get(reader)!]).toEqual(["DATABASE_URL"]);
   });

   it("preserves configuration spellings for injected object keys", () => {
      const reader = fortenv.string(() => undefined);
      const grants = buildGrants(new Map([["secret", [reader]]]), (fn) => fn === reader);
      expect([...grants.get(reader)!]).toEqual(["secret"]);
   });

   it("accepts matching name sets regardless of order or function identity", () => {
      const discovered = new Map([
         ["A", [() => undefined]],
         ["B", []],
      ]);
      const actual = new Map([
         ["B", []],
         ["A", [() => undefined]],
      ]);
      expect(() => matchingNames(discovered, actual)).not.toThrow();
   });

   it.each([
      ["added", ["A"], ["A", "B"]],
      ["removed", ["A", "B"], ["A"]],
      ["renamed", ["A"], ["B"]],
   ] as const)("rejects a secret %s between discovery and real loading", (_name, before, after) => {
      expect(() =>
         matchingNames(new Map(before.map((name) => [name, []])), new Map(after.map((name) => [name, []]))),
      ).toThrow("secret names changed");
   });
});
