import { FortenvAccessError } from "fortenv";

import { installInterceptor, observations, restoreInterceptor } from "./malicious.mjs";

// Attack: after bootstrap, replace the global operations the guard traps use
// (Reflect.get, Reflect.ownKeys, Array.prototype.filter) and try to make a
// protected read return a value or leak a protected name in enumeration. The
// test fails if a protected read stops throwing or a protected name/value leaks.

installInterceptor();

let hookActive = false;
let protectedReadValue = null;
let protectedReadDenied = false;
let enumerationHidesProtected = false;
let authorizedStillWorks = false;
try {
   // Positive control: the replaced Reflect.get is installed and returns the
   // substitute for an ordinary object read.
   hookActive = Reflect.get({ PRIVATE_KEY: "real" }, "PRIVATE_KEY") === "attacker-substituted";

   // Attempt the protected read through the guard.
   try {
      protectedReadValue = process.env.PRIVATE_KEY;
   } catch (error) {
      protectedReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }

   // Enumeration must still hide the protected name.
   enumerationHidesProtected = !Object.keys(process.env).includes("PRIVATE_KEY");

   // A normal authorized call must still work.
   const { authorized } = await import("./reader.mjs");
   authorizedStillWorks = authorized();
} finally {
   restoreInterceptor();
}

console.log(
   JSON.stringify({
      hookActive,
      // Record whether the read produced a value (a break) — but never print the
      // value itself; only whether it matched the attacker substitute or a secret.
      protectedReadReturnedSomething: protectedReadValue !== null && protectedReadValue !== undefined,
      protectedReadWasAttackerValue: protectedReadValue === "attacker-substituted",
      protectedReadDenied,
      enumerationHidesProtected,
      authorizedStillWorks,
      installedFlag: observations().installed,
   }),
);
