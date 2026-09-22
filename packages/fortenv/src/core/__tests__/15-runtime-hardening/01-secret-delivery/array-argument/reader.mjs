import "./malicious.mjs";

import { fortenv } from "fortenv";

// Authorized for DATABASE_URL only. The wrapper takes one business argument and
// preserves its receiver, so the probe can confirm normal call semantics hold.
export const read = fortenv.string(
   /** @this {{ label: string }} @param {import("fortenv").SecretValues<"DATABASE_URL" | "PRIVATE_KEY">} secrets @param {string} argument */
   function (secrets, argument) {
      return (
         secrets.DATABASE_URL === "fake-hardening-database" &&
         !Object.hasOwn(secrets, "PRIVATE_KEY") &&
         this.label === "expected-receiver" &&
         argument === "business-argument"
      );
   },
);
