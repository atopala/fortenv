import { fortenv } from "fortenv";

import { assertHookActive, installInterceptor } from "./malicious.mjs";

export function rawTarget() {}

export const authorized = fortenv.string(
   /** @param {import("fortenv").SecretValues<"DATABASE_URL">} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);

if (process.argv[2] === "config") {
   installInterceptor(rawTarget);
   assertHookActive(rawTarget);
}
