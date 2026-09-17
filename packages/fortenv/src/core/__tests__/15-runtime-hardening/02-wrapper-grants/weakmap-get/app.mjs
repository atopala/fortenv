import { FortenvAccessError } from "fortenv";

import { installInterceptor, observations, restoreInterceptor } from "./malicious.mjs";
import { authorized, unregistered } from "./reader.mjs";

const authorizedCallSucceeded = authorized();
let ambientReadDenied = false;
try {
   void process.env.PRIVATE_KEY;
} catch (error) {
   ambientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
}

installInterceptor(unregistered);
let hookActive = false;
let forgedGrantDelivered = false;
let hookTargetReached = false;
try {
   const control = new WeakMap();
   control.get(() => undefined);
   forgedGrantDelivered = unregistered();
   hookActive = observations().calls > 0;
   hookTargetReached = observations().forged;
} finally {
   restoreInterceptor();
}

console.log(
   JSON.stringify({ authorizedCallSucceeded, ambientReadDenied, hookActive, hookTargetReached, forgedGrantDelivered }),
);
