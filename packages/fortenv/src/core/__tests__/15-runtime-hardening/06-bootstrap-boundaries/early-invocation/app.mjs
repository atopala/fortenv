import { FortenvAccessError } from "fortenv";

import { attempts, authorized } from "./reader.mjs";

// Attack: try to pull the secret out of a wrapper while Fortenv is still loading
// (before grants are installed), both synchronously during config evaluation and
// via a microtask that runs inside the same loading window. The test fails if any
// pre-ready invocation saw the value.

// Let the scheduled microtask attempt run.
await new Promise((resolve) => setTimeout(resolve, 20));

// A normal post-ready call, for contrast (legitimately authorized; never printed
// as a value, only a boolean).
let normalCallSawSecret = false;
try {
   normalCallSawSecret = authorized() === "fake-hardening-database";
} catch {
   normalCallSawSecret = false;
}

let ambientReadDenied = false;
try {
   void process.env.DATABASE_URL;
} catch (error) {
   ambientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
}

const earlySawSecret = attempts.some((a) => a.sawSecret === true);
const allEarlyDenied = attempts.every((a) => a.threw === true && a.notReady === true);

console.log(
   JSON.stringify({
      earlySawSecret,
      allEarlyDenied,
      normalCallSawSecret,
      ambientReadDenied,
      earlyAttemptLabels: attempts.map((a) => a.label),
   }),
);
