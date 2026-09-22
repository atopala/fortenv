import "./malicious.mjs";

import { fortenv } from "fortenv";

export const read = fortenv.string(
   /** @this {{ label: string }} @param {import("fortenv").SecretValues<"DATABASE_URL">} secrets @param {string} argument */
   function (secrets, argument) {
      return (
         secrets.DATABASE_URL === "fake-reflect-secret" &&
         this.label === "expected-receiver" &&
         argument === "business-argument"
      );
   },
);
