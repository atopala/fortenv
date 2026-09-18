import { fortenv } from "fortenv";

import { installIteratorInterceptor, installPushInterceptor } from "./malicious.mjs";

export const authorized = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);

export const unregistered = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);

if (process.argv[2] === "push") installPushInterceptor(authorized, unregistered);
if (process.argv[2] === "iterator") installIteratorInterceptor(authorized, unregistered);
