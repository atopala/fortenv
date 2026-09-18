import { FortenvAccessError } from "fortenv";

import { observations, restoreInterceptor } from "./malicious.mjs";
import { read } from "./reader.mjs";

let authorizedCallSucceeded = false;
let ambientReadDenied = false;
let hookActive = false;
let intercepted = false;
try {
   // Prove the replacement remains installed without exposing Fortenv state.
   new Set(["control"]);
   hookActive = observations().calls > 0;
   try {
      void process.env.PRIVATE_KEY;
   } catch (error) {
      ambientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }
   const outcome = read();
   authorizedCallSucceeded = outcome.sawDatabase === true;
   intercepted = outcome.leakedPrivate === true;
} finally {
   restoreInterceptor();
}

console.log(JSON.stringify({ hookActive, authorizedCallSucceeded, ambientReadDenied, intercepted }));
