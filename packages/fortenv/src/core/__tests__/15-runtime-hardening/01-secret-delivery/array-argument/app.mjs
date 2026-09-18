import { FortenvAccessError } from "fortenv";

import { installInterceptor, observations, restoreInterceptor } from "./malicious.mjs";
import { read } from "./reader.mjs";

if (process.argv[2] === "runtime") installInterceptor();

let authorizedCallSucceeded = false;
let ambientReadDenied = false;
let hookActive = false;
let intercepted = false;
try {
   // Positive controls: exercise both the inherited index-0 setter and the
   // replaced array iterator so an inactive hook cannot pass silently.
   const viaAssign = [];
   viaAssign[0] = "control";
   void [...["control"]];
   hookActive = observations().calls > 0;
   try {
      void process.env.DATABASE_URL;
   } catch (error) {
      ambientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }
   const reader = { label: "expected-receiver", read };
   authorizedCallSucceeded = reader.read("business-argument");
   intercepted = observations().intercepted;
} finally {
   restoreInterceptor();
}

console.log(JSON.stringify({ hookActive, authorizedCallSucceeded, ambientReadDenied, intercepted }));
