import { fortenv } from "fortenv";

// Records the outcome of every early invocation attempt so the app can report
// whether any of them ever saw the secret VALUE.
/** @type {Array<{ label: string; threw: boolean; notReady?: boolean; sawSecret: boolean }>} */
export const attempts = [];

export const authorized = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.DATABASE_URL,
);

/** Try to invoke the wrapper and capture what it returned or threw.
 * @param {string} label
 */
function tryCall(label) {
   try {
      const value = authorized();
      attempts.push({ label, threw: false, sawSecret: value === "fake-hardening-database" });
   } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      attempts.push({
         label,
         threw: true,
         notReady: message.includes("cannot run while configuration"),
         sawSecret: false,
      });
   }
}

// T1: this module is part of the real config dependency graph, so these calls run
// while Fortenv is still loading — before grants are installed. Both the direct
// call and the microtask execute within the loading window and must be denied.
tryCall("config-eval-sync");
queueMicrotask(() => tryCall("config-eval-microtask"));
