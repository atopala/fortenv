import { FortenvAccessError } from "fortenv";

import { observations, restoreInterceptor } from "./malicious.mjs";
import { authorized, unregistered } from "./reader.mjs";

const vector = process.argv[2];

let authorizedCallSucceeded = false;
let ambientReadDenied = false;
let pollutionActive = false;
let injectionExpanded = false;
let forgedGrantDelivered = false;
try {
   // Positive control: prove the pollution installed at T1 is still active and
   // reachable through ordinary inherited property access, without touching Fortenv.
   if (vector === "objectData") {
      /** @type {Record<string, unknown>} */
      const probe = {};
      pollutionActive = probe.PRIVATE_KEY === "fake-hardening-private-key";
   } else if (vector === "arrayIndex") {
      pollutionActive = /** @type {unknown[]} */ ([])[0] === "PRIVATE_KEY";
   }

   const outcome = authorized();
   authorizedCallSucceeded = outcome.sawDatabase === true;
   injectionExpanded = outcome.leakedPrivate === true;

   try {
      void process.env.PRIVATE_KEY;
   } catch (error) {
      ambientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }

   // A secure runtime hands the unregistered wrapper an empty injection object.
   forgedGrantDelivered = unregistered();
   void observations();
} finally {
   restoreInterceptor();
}

console.log(
   JSON.stringify({
      authorizedCallSucceeded,
      ambientReadDenied,
      pollutionActive,
      injectionExpanded,
      forgedGrantDelivered,
   }),
);
