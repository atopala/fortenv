import assert from "node:assert/strict";
import { setImmediate as nextTurn } from "node:timers/promises";

import { fortenv, type SecretValues } from "fortenv";

// Return caught errors to the assertion app so both reads and detached callbacks are checked.
function attemptRead(name: string): string | undefined | Error {
   try {
      return process.env[name];
   } catch (error) {
      if (!(error instanceof Error)) throw error;
      return error;
   }
}

export const helper = () => [attemptRead("SECRET_A"), attemptRead("SECRET_B")];
export const ambientAtImport = helper();
const injected = (secrets: SecretValues<"SECRET_A" | "SECRET_B">) => {
   // A normal helper still cannot read either protected environment key.
   assert.throws(() => process.env.SECRET_A, /unauthorized access/);
   assert.throws(() => process.env.SECRET_B, /unauthorized access/);
   return [secrets.SECRET_A, secrets.SECRET_B];
};
export const readA = fortenv.string(function (
   this: { label: string },
   secrets: SecretValues<"SECRET_A" | "SECRET_B">,
   argument: number,
) {
   return { values: injected(secrets), label: this.label, argument };
});
export const readB = fortenv.string(async (secrets: SecretValues<"SECRET_A" | "SECRET_B">) => {
   await nextTurn();
   return injected(secrets);
});
export const outer = fortenv.string(async (secrets: SecretValues<"SECRET_A" | "SECRET_B">) => {
   const before = injected(secrets);
   const inner = await readB();
   return [before, inner, injected(secrets)];
});
export const concurrentA = fortenv.string(
   async (secrets: SecretValues<"SECRET_A" | "SECRET_B">, wait: Promise<void>, signal: () => void) => {
      signal();
      await wait;
      return injected(secrets);
   },
);
export const concurrentB = fortenv.string(
   async (secrets: SecretValues<"SECRET_A" | "SECRET_B">, wait: Promise<void>, signal: () => void) => {
      await wait;
      signal();
      await nextTurn();
      return injected(secrets);
   },
);
export const detached = fortenv.string(
   (secrets: SecretValues<"SECRET_A" | "SECRET_B">, done: (value: ReturnType<typeof helper>) => void) => {
      setImmediate(() => done(helper()));
      return injected(secrets);
   },
);
export const throws = fortenv.string(
   (
      _secrets: SecretValues<"SECRET_A" | "SECRET_B">,
      error: Error,
      done: (value: ReturnType<typeof helper>) => void,
   ) => {
      setImmediate(() => done(helper()));
      throw error;
   },
);
export const rejects = fortenv.string(
   async (
      _secrets: SecretValues<"SECRET_A" | "SECRET_B">,
      error: Error,
      done: (value: ReturnType<typeof helper>) => void,
   ) => {
      setImmediate(() => done(helper()));
      await Promise.resolve();
      throw error;
   },
);
