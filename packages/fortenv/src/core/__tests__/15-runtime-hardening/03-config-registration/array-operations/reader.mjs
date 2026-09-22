import { fortenv } from "fortenv";

import { installIteratorInterceptor, installPushInterceptor } from "./malicious.mjs";

export const authorized = fortenv.string(
   /** @param {import("fortenv").SecretValues<"DATABASE_URL">} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);

export const unregistered = fortenv.string(
   /** @param {import("fortenv").SecretValues<"DATABASE_URL">} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);

if (process.argv[2] === "push") installPushInterceptor(authorized, unregistered);
if (process.argv[2] === "iterator") installIteratorInterceptor(authorized, unregistered);
