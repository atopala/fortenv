import { FortenvAccessError } from "fortenv";

import { installInterceptor, observations, replacementError, restoreInterceptor } from "./malicious.mjs";

installInterceptor();

let hookActive = false;
let hookTargetReached = false;
let accessDenied = false;
let mutationDenied = false;
let replacementErrorObserved = false;
try {
   JSON.stringify("control");
   hookActive = observations().calls > 0;
   try {
      void process.env.DATABASE_URL;
   } catch (error) {
      accessDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
      replacementErrorObserved ||= error === replacementError;
   }
   try {
      process.env.DATABASE_URL = "fake-attacker-value";
   } catch (error) {
      mutationDenied = error instanceof TypeError;
      replacementErrorObserved ||= error === replacementError;
   }
   hookTargetReached = observations().targeted;
} finally {
   restoreInterceptor();
}

console.log(JSON.stringify({ hookActive, hookTargetReached, accessDenied, mutationDenied, replacementErrorObserved }));
