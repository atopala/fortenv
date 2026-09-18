import { FortenvAccessError } from "fortenv";

import { observations, restoreInterceptor } from "./malicious.mjs";
import { authorized, unregistered } from "./reader.mjs";

let authorizedCallSucceeded = false;
let ambientReadDenied = false;
let hookActive = false;
let hookTargetReached = false;
let forgedGrantDelivered = false;
try {
   authorizedCallSucceeded = authorized();
   try {
      void process.env.PRIVATE_KEY;
   } catch (error) {
      ambientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }
   // Prove the replacement is still installed without passing Fortenv state to it.
   new WeakMap().set({}, true);
   hookActive = observations().calls > 0;
   hookTargetReached = observations().forged;
   // A secure runtime hands the unregistered wrapper an empty injection object.
   forgedGrantDelivered = unregistered();
} finally {
   restoreInterceptor();
}

console.log(
   JSON.stringify({ authorizedCallSucceeded, ambientReadDenied, hookActive, hookTargetReached, forgedGrantDelivered }),
);
