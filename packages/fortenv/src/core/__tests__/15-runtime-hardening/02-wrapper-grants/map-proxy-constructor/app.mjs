import { FortenvAccessError } from "fortenv";

import { observations, restoreInterceptor } from "./malicious.mjs";
import { authorized, unregistered } from "./reader.mjs";

let authorizedCallSucceeded = false;
let ambientReadDenied = false;
let hookActive = false;
let forgedGrantDelivered = false;
try {
   authorizedCallSucceeded = authorized();
   try {
      void process.env.PRIVATE_KEY;
   } catch (error) {
      ambientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }
   const seen = observations();
   // The replaced Proxy constructor ran during wrapper creation (proxyCalls>0).
   // Fortenv builds its own Maps through an eagerly captured constructor, so it
   // never calls the replaced global Map — prove that replacement is nonetheless
   // installed and callable via an independent construction.
   const independentMap = new Map([["k", "v"]]);
   hookActive = seen.installed && seen.proxyCalls > 0 && observations().mapCalls > 0 && independentMap.get("k") === "v";
   // A secure runtime still hands the unregistered wrapper an empty object.
   forgedGrantDelivered = unregistered();
} finally {
   restoreInterceptor();
}

console.log(JSON.stringify({ authorizedCallSucceeded, ambientReadDenied, hookActive, forgedGrantDelivered }));
