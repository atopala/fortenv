import { FortenvAccessError } from "fortenv";

// EXPLORATORY TEST — validating assumptions, not asserting an agreed contract.
//
// Purpose: observe how the CURRENT library reacts when ordinary dependency code
// (running after bootstrap) tries to replace, redefine, delete, or bypass the
// installed `process.env` guard. We do NOT yet know or assume what the "correct"
// tamper response should be (that decision is pending design review). This probe
// only RECORDS what happens for each attempt and enforces the one invariant we
// are already committed to: no secret VALUE may leak. Names may appear.
//
// The parent test asserts only that no fake value leaks; the recorded outcomes
// are printed for human review, not asserted against a fixed contract.

/** Returns whether a protected read still throws the denial error. */
function protectedReadStillDenied() {
   try {
      void process.env.PRIVATE_KEY;
      return false;
   } catch (error) {
      return error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }
}

/** Run one tamper attempt, capture its result, then re-check denial.
 * @param {string} name
 * @param {() => unknown} attempt
 */
function probe(name, attempt) {
   let outcome;
   try {
      const returned = attempt();
      outcome = { threw: false, returned: returned === undefined ? "undefined" : String(returned) };
   } catch (error) {
      outcome = { threw: true, error: error instanceof Error ? error.constructor.name : String(error) };
   }
   return { name, ...outcome, deniedAfter: protectedReadStillDenied() };
}

const results = [];

// 1. Reassign process.env to a plain object (strict-mode assignment).
results.push(
   probe("assign-process-env", () => {
      process.env = { PRIVATE_KEY: "attacker" };
      return "assigned";
   }),
);

// 2. Redefine the process.env property with a fresh descriptor.
results.push(
   probe("defineProperty-process-env", () => {
      Object.defineProperty(process, "env", { value: { PRIVATE_KEY: "attacker" }, configurable: true });
      return "redefined";
   }),
);

// 3. Delete process.env entirely.
results.push(
   probe("delete-process-env", () => {
      return Reflect.deleteProperty(process, "env");
   }),
);

// 4. Reach the guard via its descriptor and try to read a protected key through it.
results.push(
   probe("read-through-descriptor", () => {
      const descriptor = Object.getOwnPropertyDescriptor(process, "env");
      const guard = descriptor?.value;
      // Reading a protected key through the retrieved guard must still throw.
      return guard?.PRIVATE_KEY;
   }),
);

// 5. Attempt a protected-key mutation through the guard.
results.push(
   probe("mutate-protected-key", () => {
      process.env.DATABASE_URL = "attacker-overwrite";
      return "mutated";
   }),
);

// 6. Reflect.defineProperty variant of the redefine attempt.
results.push(
   probe("reflect-defineProperty-process-env", () => {
      return Reflect.defineProperty(process, "env", { value: { PRIVATE_KEY: "attacker" }, configurable: true });
   }),
);

// Final invariant check after all attempts.
const finalDenied = protectedReadStillDenied();

console.log(JSON.stringify({ results, finalDenied }));
