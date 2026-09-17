import { describe, expect, it } from "vitest";

import { captureSecrets, normalizeName } from "../../../runtime/node/environment.js";

describe("09 — Capture and scrub secrets", () => {
   it("captures fake secrets and scrubs the same original object", () => {
      const original = { DATABASE_URL: "fake-database", EMPTY: "", NODE_ENV: "test" };
      const retainedReference = original;
      const values = captureSecrets(original, ["DATABASE_URL", "EMPTY", "MISSING"]);
      expect([...values]).toEqual([
         ["DATABASE_URL", "fake-database"],
         ["EMPTY", ""],
         ["MISSING", undefined],
      ]);
      expect(retainedReference).toEqual({ NODE_ENV: "test" });
      expect(values.has("MISSING")).toBe(true);
      expect("DATABASE_URL" in retainedReference).toBe(false);
   });

   it("captures duplicate names once before deletion and keeps later writes separate", () => {
      const original: NodeJS.ProcessEnv = { DATABASE_URL: "fake-database" };
      const values = captureSecrets(original, ["DATABASE_URL", "DATABASE_URL"]);
      original.DATABASE_URL = "replacement";
      expect([...values]).toEqual([["DATABASE_URL", "fake-database"]]);
   });

   it("leaves the environment intact for an empty policy", () => {
      const original = { NODE_ENV: "test", PATH: "fake-path" };
      expect([...captureSecrets(original, [])]).toEqual([]);
      expect(original).toEqual({ NODE_ENV: "test", PATH: "fake-path" });
   });

   it("uses the host's environment-key case rules", () => {
      expect(normalizeName("Secret")).toBe(process.platform === "win32" ? "SECRET" : "Secret");
   });
});
