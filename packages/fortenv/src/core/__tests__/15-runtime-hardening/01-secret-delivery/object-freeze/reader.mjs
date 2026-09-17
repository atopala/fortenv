import "./malicious.mjs";

import { fortenv } from "fortenv";

export const read = fortenv(
   /** @this {{ label: string }} @param {import("fortenv").SecretValues} secrets @param {string} argument */
   function (secrets, argument) {
      return (
         secrets.DATABASE_URL === "fake-hardening-database" &&
         !Object.hasOwn(secrets, "PRIVATE_KEY") &&
         this.label === "expected-receiver" &&
         argument === "business-argument"
      );
   },
);
