import { FortenvAccessError } from "fortenv";

import { installInterceptor, observations, restoreInterceptor } from "./malicious.mjs";

installInterceptor();

let hookActive = false;
let accessDenied = false;
let readReturned = false;
let writeDenied = false;
let protectedNameEnumerated = false;
try {
   new Set(["control"]).has("control");
   hookActive = observations().calls > 0;
   try {
      void process.env.DATABASE_URL;
      readReturned = true;
   } catch (error) {
      accessDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
   }
   try {
      process.env.DATABASE_URL = "fake-attacker-value";
   } catch (error) {
      writeDenied = error instanceof TypeError;
   }
   protectedNameEnumerated = Object.keys(process.env).includes("DATABASE_URL");
   if (!writeDenied) delete process.env.DATABASE_URL;
} finally {
   restoreInterceptor();
}

console.log(JSON.stringify({ hookActive, accessDenied, readReturned, writeDenied, protectedNameEnumerated }));
