import { FortenvAccessError } from "fortenv";

import { forgeGrant, observations, restoreInterceptor } from "./malicious.mjs";
import { authorized, unregistered } from "./reader.mjs";

let hookActive = false;
let registryCaptured = false;
let grantForged = false;
let authorizedCallSucceeded = false;
let forgedGrantDelivered = false;
let ambientReadDenied = false;
try {
   // Positive control: prove that the replacement remains installed after bootstrap.
   new WeakMap();
   forgeGrant(authorized, unregistered);
   ({ registryCaptured, grantForged } = observations());
   hookActive = observations().calls > 0;
   authorizedCallSucceeded = authorized();
   forgedGrantDelivered = unregistered();
   try {
      void process.env.PRIVATE_KEY;
   } catch (error) {
      ambientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }
} finally {
   restoreInterceptor();
}

console.log(
   JSON.stringify({
      hookActive,
      registryCaptured,
      grantForged,
      authorizedCallSucceeded,
      forgedGrantDelivered,
      ambientReadDenied,
   }),
);
