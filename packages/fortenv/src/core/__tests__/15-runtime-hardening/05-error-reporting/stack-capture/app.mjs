import { FortenvAccessError } from "fortenv";

import { installInterceptor, observations, restoreInterceptor } from "./malicious.mjs";
import { authorized } from "./reader.mjs";

installInterceptor();

let deniedWithContractError = false;
let deniedThrewSomething = false;
let deniedErrorName = null;
let hookActive = false;
let authorizedStillWorks = false;
let leakedInErrorText = false;
try {
   // Positive control: the replaced captureStackTrace throws when called directly.
   try {
      Error.captureStackTrace({});
   } catch {
      hookActive = observations().captureCalls > 0;
   }

   // Trigger a denied read; Fortenv builds a FortenvAccessError, which calls the
   // (now hostile) captureStackTrace. Observe what actually gets thrown.
   try {
      void process.env.PRIVATE_KEY;
   } catch (error) {
      deniedThrewSomething = true;
      deniedErrorName = error instanceof Error ? error.constructor.name : String(error);
      deniedWithContractError = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
      const text = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
      leakedInErrorText = text.includes("fake-hardening-private-key");
   }

   // Authorized path must still work after the tampering.
   try {
      authorizedStillWorks = authorized();
   } catch {
      authorizedStillWorks = false;
   }
} finally {
   restoreInterceptor();
}

console.log(
   JSON.stringify({
      hookActive,
      deniedThrewSomething,
      deniedErrorName,
      deniedWithContractError,
      leakedInErrorText,
      authorizedStillWorks,
   }),
);
