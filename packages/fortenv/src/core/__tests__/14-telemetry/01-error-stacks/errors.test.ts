import { describe, expect, it } from "vitest";

import { createEnvironmentGuard } from "../../../../runtime/node/environment.js";
import { directSecretRead, outermostCaller } from "./readers.js";

describe("14.01 — Access errors and caller stacks", () => {
   it("throws a structured access error without exposing the secret value", () => {
      const guard = createEnvironmentGuard({}, new Set(["DATABASE_URL"]));
      let caught: unknown;
      try {
         directSecretRead(guard);
      } catch (error) {
         caught = error;
      }

      expect(caught).toBeInstanceOf(Error);
      expect(caught).toMatchObject({
         name: "FortenvAccessError",
         code: "FORTENV_ACCESS_DENIED",
         operation: "get",
         secret: "DATABASE_URL",
      });
      const error = caught as Error;
      expect(error.stack).toContain("directSecretRead");
      expect(error.stack).toContain("readers.ts:");
      expect(error.stack).not.toContain("fake-stack-secret");
      expect(JSON.stringify(error)).not.toContain("fake-stack-secret");
   });

   it.each([0, 2, 10])("captures callers beyond an application stack limit of %s and restores that limit", (limit) => {
      const guard = createEnvironmentGuard({}, new Set(["DATABASE_URL"]));
      const originalLimit = Error.stackTraceLimit;
      try {
         Error.stackTraceLimit = limit;
         let caught: unknown;
         try {
            outermostCaller(guard);
         } catch (error) {
            caught = error;
         }

         expect(Error.stackTraceLimit).toBe(limit);
         expect(caught).toBeInstanceOf(Error);
         const stack = (caught as Error).stack;
         expect(stack).toContain("directSecretRead");
         expect(stack).toContain("outermostCaller");
         expect(stack?.match(/at nestedRead\b/g)).toHaveLength(21);
      } finally {
         Error.stackTraceLimit = originalLimit;
      }
   });
});
