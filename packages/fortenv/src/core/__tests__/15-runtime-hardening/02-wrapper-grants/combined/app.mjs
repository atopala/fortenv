import { FortenvAccessError } from "fortenv";

import { observations, restoreInterceptor } from "./malicious.mjs";
import { authorized, unregistered } from "./reader.mjs";

let authorizedCallSucceeded = false;
let ambientReadDenied = false;
let hookActive = false;
let grantRedirected = false;
let iterationExpanded = false;
let forgedGrantDelivered = false;
let injectionExpanded = false;
try {
   const outcome = authorized();
   authorizedCallSucceeded = outcome.sawDatabase === true;
   injectionExpanded = outcome.leakedPrivate === true;
   try {
      void process.env.PRIVATE_KEY;
   } catch (error) {
      ambientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }
   // Prove both replacements are still installed without passing Fortenv state
   // to them: an independent WeakMap.set and an independent Set iteration.
   new WeakMap().set({}, true);
   void [...new Set(["control"])];
   const seen = observations();
   hookActive = seen.hookActive;
   grantRedirected = seen.grantRedirected;
   iterationExpanded = seen.iterationExpanded;
   // A secure runtime hands the unregistered wrapper an empty injection object.
   forgedGrantDelivered = unregistered();
} finally {
   restoreInterceptor();
}

console.log(
   JSON.stringify({
      authorizedCallSucceeded,
      ambientReadDenied,
      hookActive,
      grantRedirected,
      iterationExpanded,
      forgedGrantDelivered,
      injectionExpanded,
   }),
);
