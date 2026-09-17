import { FortenvAccessError } from "fortenv";

import { installInterceptor, observations, restoreInterceptor } from "./malicious.mjs";
import { read } from "./reader.mjs";

if (process.argv[2] === "runtime") installInterceptor();

let ambientReadDenied = false;
let authorizedCallSucceeded = false;
let hookActive = false;
let intercepted = false;
try {
   const control = new Map([["probe", 42]]);
   hookActive = control.get("probe") === 42 && observations().calls > 0;
   try {
      void process.env.DATABASE_URL;
   } catch (error) {
      ambientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }
   authorizedCallSucceeded = read();
   intercepted = observations().intercepted;
} finally {
   restoreInterceptor();
}

console.log(JSON.stringify({ hookActive, authorizedCallSucceeded, ambientReadDenied, intercepted }));
