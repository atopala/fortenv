import { FortenvAccessError } from "fortenv";

// SEC-22 assurance: exercise every diagnostic surface with fake values set, and
// let the parent test assert that no secret VALUE appears in stdout/stderr. Name
// disclosure (e.g. "PRIVATE_KEY") is documented and allowed; a value is not.
// This file deliberately captures and prints error text/stacks so the parent can
// scan them — it must never print a value on any path.

const observations = {};

// 1. Denied read of a protected secret (no stderr subscriber → stderr fallback fires).
try {
   void process.env.PRIVATE_KEY;
} catch (error) {
   observations.deniedName = error instanceof FortenvAccessError ? error.secret : null;
   observations.deniedMessage = error instanceof Error ? error.message : String(error);
   observations.deniedStack = error instanceof Error ? (error.stack ?? "") : "";
}

// 2. Protected mutation rejection.
try {
   process.env.DATABASE_URL = "attacker-overwrite";
} catch (error) {
   observations.mutationMessage = error instanceof Error ? error.message : String(error);
}

// 3. Enumeration (emits a warning event because telemetry.enumeration is on).
observations.enumeratedKeysHidePrivate = !Object.keys(process.env).includes("PRIVATE_KEY");

// 4. A config-shaped validation failure surfaced through defineConfig.
try {
   const { defineConfig } = await import("fortenv/config");
   // A grant array containing a non-function triggers a validation error whose
   // message references the name, never a value. The invalid element is the point
   // of the test, so the type error is expected and asserted by the compiler.
   // @ts-expect-error intentional invalid grant to exercise runtime validation
   defineConfig({ secrets: { DATABASE_URL: ["not-a-function"] } });
} catch (error) {
   observations.validationMessage = error instanceof Error ? error.message : String(error);
}

console.log(JSON.stringify(observations));
