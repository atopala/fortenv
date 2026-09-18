import { fortenv, FortenvConfigError, FortenvStateError, FortenvUsageError } from "fortenv";
import { defineConfig } from "fortenv/config";
import { describe, expect, it } from "vitest";

// TDD (RED first): the error taxonomy is a new behavioral contract. These tests
// assert the new typed errors and their stable codes at representative real throw
// sites. They must fail against the current plain-Error implementation, then pass
// once the classes exist and the throw sites are migrated. Existing message text
// is preserved, so the message-substring tests elsewhere stay green.

describe("16 — Error taxonomy", () => {
   it("exports the new error classes from the root entry", () => {
      expect(typeof FortenvConfigError).toBe("function");
      expect(typeof FortenvStateError).toBe("function");
      expect(typeof FortenvUsageError).toBe("function");
   });

   it("throws FortenvConfigError with a stable code for invalid configuration", () => {
      let caught: unknown;
      try {
         // defineConfig validates through the same path as real registration.
         defineConfig(new Date() as unknown as Parameters<typeof defineConfig>[0]);
      } catch (error) {
         caught = error;
      }
      expect(caught).toBeInstanceOf(FortenvConfigError);
      expect(caught).toBeInstanceOf(Error);
      expect((caught as FortenvConfigError).code).toBe("FORTENV_CONFIG_INVALID");
      expect((caught as FortenvConfigError).name).toBe("FortenvConfigError");
      // Message text is preserved from the pre-taxonomy implementation.
      expect((caught as Error).message).toContain("plain object");
   });

   it("throws FortenvStateError with a stable code for calls before initialization", () => {
      // A fresh wrapper invoked before bootstrap is a lifecycle/state error.
      const read = fortenv(() => "unused");
      let caught: unknown;
      try {
         read();
      } catch (error) {
         caught = error;
      }
      expect(caught).toBeInstanceOf(FortenvStateError);
      expect((caught as FortenvStateError).code).toBe("FORTENV_INVALID_STATE");
      expect((caught as FortenvStateError).name).toBe("FortenvStateError");
      expect((caught as Error).message).toContain("not initialized");
   });

   it("throws FortenvUsageError (a TypeError) for an unsupported wrapped-function kind", () => {
      let caught: unknown;
      try {
         fortenv(function* () {
            yield 1;
         });
      } catch (error) {
         caught = error;
      }
      expect(caught).toBeInstanceOf(FortenvUsageError);
      // Bad caller input remains a TypeError for compatibility.
      expect(caught).toBeInstanceOf(TypeError);
      expect((caught as FortenvUsageError).code).toBe("FORTENV_INVALID_USAGE");
      expect((caught as FortenvUsageError).name).toBe("FortenvUsageError");
      expect((caught as Error).message).toContain("not a generator");
   });
});
