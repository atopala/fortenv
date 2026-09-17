import { FortenvAccessError } from "fortenv";

import { installInterceptor, observations, restoreInterceptor } from "./malicious.mjs";
import { read } from "./reader.mjs";

if (process.argv[2] === "runtime") installInterceptor();

let ambientReadDenied = false;
let authorizedCallSucceeded = false;
let hookActive = false;
let intercepted = false;
try {
   Object.freeze({ harmless: true });
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
