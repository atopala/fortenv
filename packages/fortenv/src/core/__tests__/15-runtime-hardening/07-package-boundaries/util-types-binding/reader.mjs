import { fortenv } from "fortenv";

import { installInterceptor } from "./malicious.mjs";

// T1: tamper the isGeneratorFunction binding before wrapping, to try to slip a
// generator function past fortenv()'s validation.
if (process.argv[2] === "config") installInterceptor();

// Attempt to wrap a generator function. Normally fortenv() throws a TypeError
// here; with the binding tampered it may succeed. Record which happened.
/** @type {{ wrapped: Function | undefined; threw: boolean; message?: string }} */
export let generatorWrapResult;
try {
   const wrapped = fortenv(
      /** @param {import("fortenv").SecretValues} secrets */
      // eslint-disable-next-line require-yield
      function* (secrets) {
         return secrets.DATABASE_URL;
      },
   );
   generatorWrapResult = { wrapped, threw: false };
} catch (error) {
   generatorWrapResult = { wrapped: undefined, threw: true, message: error instanceof Error ? error.message : "" };
}

// A normal wrapper that is granted the secret, for contrast.
export const authorized = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);
