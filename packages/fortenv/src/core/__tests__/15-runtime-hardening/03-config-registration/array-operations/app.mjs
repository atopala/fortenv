import { FortenvAccessError } from "fortenv";

import { observations, restoreInterceptors } from "./malicious.mjs";
import { authorized, unregistered } from "./reader.mjs";

let hookActive = false;
let authorizedCallSucceeded = false;
let forgedGrantDelivered = false;
let ambientReadDenied = false;
try {
   if (process.argv[2] === "push") [authorized].push(authorized);
   if (process.argv[2] === "iterator") void [...[authorized]];
   const seen = observations();
   hookActive = seen.calls > 0 && seen.targeted;
   authorizedCallSucceeded = authorized();
   forgedGrantDelivered = unregistered();
   try {
      void process.env.DATABASE_URL;
   } catch (error) {
      ambientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }
} finally {
   restoreInterceptors();
}

console.log(JSON.stringify({ hookActive, authorizedCallSucceeded, forgedGrantDelivered, ambientReadDenied }));
