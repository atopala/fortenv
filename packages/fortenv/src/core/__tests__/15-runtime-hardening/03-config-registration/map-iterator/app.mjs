import { FortenvAccessError } from "fortenv";

import { observations, restoreInterceptor } from "./malicious.mjs";
import { authorized, unregistered } from "./reader.mjs";

let hookActive = false;
let authorizedCallSucceeded = false;
let forgedGrantDelivered = false;
let ambientReadDenied = false;
try {
   // Positive control: ordinary Map iteration still reaches the replacement.
   void [...new Map([["control", true]])];
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

console.log(JSON.stringify({ hookActive, authorizedCallSucceeded, forgedGrantDelivered, ambientReadDenied }));
