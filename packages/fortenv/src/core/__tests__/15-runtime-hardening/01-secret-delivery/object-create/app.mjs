import { FortenvAccessError } from "fortenv";

import { installInterceptor, observations, restoreInterceptor } from "./malicious.mjs";
import { read } from "./reader.mjs";

if (process.argv[2] === "runtime") installInterceptor();

let ambientReadDenied = false;
let authorizedCallSucceeded = false;
let hookActive = false;
let intercepted = false;
try {
   const control = Object.create(null);
   control.harmless = true;
   hookActive = observations().calls > 0 && control.harmless === true;
   try {
      void process.env.PRIVATE_KEY;
   } catch (error) {
      ambientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }
   authorizedCallSucceeded = read();
   intercepted = observations().intercepted;
} finally {
   restoreInterceptor();
}

console.log(JSON.stringify({ hookActive, authorizedCallSucceeded, ambientReadDenied, intercepted }));
