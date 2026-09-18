import { FortenvAccessError } from "fortenv";

import { installInterceptor, observations, restoreInterceptor } from "./malicious.mjs";
import { read } from "./reader.mjs";

if (process.argv[2] === "runtime") installInterceptor();

let authorizedCallSucceeded = false;
let ambientReadDenied = false;
let hookActive = false;
let intercepted = false;
try {
   // Positive control: a grant-shaped set iterated through the hook.
   const control = new Set(["DATABASE_URL"]);
   void [...control];
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
