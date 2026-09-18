import { FortenvAccessError } from "fortenv";

import { observations, restoreInterceptor } from "./malicious.mjs";
import { authorized, unregistered } from "./reader.mjs";

let hookActive = false;
let hookTargetReached = false;
let authorizedCallSucceeded = false;
let forgedGrantDelivered = false;
let ambientReadDenied = false;
try {
   Object.getOwnPropertyDescriptor({ control: true }, "control");
   const seen = observations();
   hookActive = seen.calls > 0;
   hookTargetReached = seen.targeted;
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
      hookTargetReached,
      authorizedCallSucceeded,
      forgedGrantDelivered,
      ambientReadDenied,
   }),
);
