import { FortenvAccessError } from "fortenv";

import { authorized } from "./reader.mjs";

// If bootstrap rejected (name mismatch between discovery and real import), the
// --import register step turns that into a startup failure and this file may not
// run at all. When it does run, report what is observable.
console.log("APP_STARTED");

let databaseDenied = false;
let secretTwoAmbientReadable = false;
let authorizedOutcome = null;

// The undiscovered SECRET_TWO was never passed to protectEnvironment. Can it
// still be read ambiently? That is the leak this probe is looking for.
try {
   secretTwoAmbientReadable = process.env.SECRET_TWO === "fake-hardening-secret-two";
} catch {
   secretTwoAmbientReadable = false;
}

// DATABASE_URL was discovered and protected; an ambient read must still throw.
try {
   void process.env.DATABASE_URL;
} catch (error) {
   databaseDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
}

try {
   authorizedOutcome = authorized();
} catch (error) {
   authorizedOutcome = { threw: error instanceof Error ? error.message : String(error) };
}

console.log(JSON.stringify({ databaseDenied, secretTwoAmbientReadable, authorizedOutcome }));
