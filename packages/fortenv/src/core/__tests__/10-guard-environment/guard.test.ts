import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { captureSecrets, createEnvironmentGuard } from "../../../runtime/node/environment.js";

describe("10 — Guard environment access", () => {
   it("always denies configured names, including missing values, and delegates ordinary reads", () => {
      const original = { DATABASE_URL: "fake-database", NODE_ENV: "test" };
      const values = captureSecrets(original, ["DATABASE_URL", "MISSING"]);
      const guard = createEnvironmentGuard(original, new Set(values.keys()));
      expect(() => guard.DATABASE_URL).toThrow('Fortenv: unauthorized access to secret "DATABASE_URL".');
      expect(() => guard.MISSING).toThrow('Fortenv: unauthorized access to secret "MISSING".');
      expect(guard.NODE_ENV).toBe("test");
   });

   it("hides protected keys and values from every reflection operation", () => {
      const original = { DATABASE_URL: "fake-database", NODE_ENV: "test" };
      const guard = createEnvironmentGuard(
         original,
         new Set(captureSecrets(original, ["DATABASE_URL", "MISSING"]).keys()),
      );
      expect(Object.keys(guard)).toEqual(["NODE_ENV"]);
      expect(Object.values(guard)).toEqual(["test"]);
      expect(Object.entries(guard)).toEqual([["NODE_ENV", "test"]]);
      expect(Reflect.ownKeys(guard)).toEqual(["NODE_ENV"]);
      expect({ ...guard }).toEqual({ NODE_ENV: "test" });
      expect(JSON.stringify(guard)).toBe('{"NODE_ENV":"test"}');
      const keys = [];
      for (const key in guard) keys.push(key);
      expect(keys).toEqual(["NODE_ENV"]);
      expect("DATABASE_URL" in guard).toBe(false);
      expect("MISSING" in guard).toBe(false);
      expect(Object.getOwnPropertyDescriptor(guard, "DATABASE_URL")).toBeUndefined();
      expect(Object.getOwnPropertyDescriptors(guard)).toEqual(Object.getOwnPropertyDescriptors({ NODE_ENV: "test" }));
   });

   it.each(["DATABASE_URL", "MISSING"])("rejects mutation of protected %s", (name) => {
      const original = { DATABASE_URL: "fake-database" };
      const guard = createEnvironmentGuard(
         original,
         new Set(captureSecrets(original, ["DATABASE_URL", "MISSING"]).keys()),
      );
      expect(() => {
         guard[name] = "replacement";
      }).toThrow("read-only");
      expect(() => {
         delete guard[name];
      }).toThrow("read-only");
      expect(() => Object.defineProperty(guard, name, { value: "replacement" })).toThrow("read-only");
      expect(() => guard.DATABASE_URL).toThrow("unauthorized access");
      expect(() => guard.MISSING).toThrow("unauthorized access");
      expect(original).toEqual({});
   });

   it("delegates normal mutation and does not expose secrets written through a retained reference", () => {
      const original: NodeJS.ProcessEnv = { DATABASE_URL: "fake-database", NODE_ENV: "test" };
      const guard = createEnvironmentGuard(original, new Set(captureSecrets(original, ["DATABASE_URL"]).keys()));
      guard.NODE_ENV = "production";
      expect(original.NODE_ENV).toBe("production");
      delete guard.NODE_ENV;
      expect(original.NODE_ENV).toBeUndefined();
      original.DATABASE_URL = "replacement";
      expect(() => guard.DATABASE_URL).toThrow('Fortenv: unauthorized access to secret "DATABASE_URL".');
      expect(Object.keys(guard)).toEqual([]);
      expect(Reflect.setPrototypeOf(guard, {})).toBe(false);
      expect(Reflect.preventExtensions(guard)).toBe(false);
   });

   it("installs the guard on real Node process.env in an isolated process", () => {
      const result = spawnSync(process.execPath, [fileURLToPath(new URL("./live-environment.mjs", import.meta.url))], {
         encoding: "utf8",
         timeout: 10_000,
         env: {
            PATH: process.env.PATH,
            SystemRoot: process.env.SystemRoot,
            DATABASE_URL: "fake-database",
            NODE_ENV: "test",
         },
      });
      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("ok\n");
   });
});
