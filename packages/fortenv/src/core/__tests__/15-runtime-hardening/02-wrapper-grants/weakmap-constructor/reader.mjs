import { fortenv } from "fortenv";

import { installInterceptor } from "./malicious.mjs";

export const authorized = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database" && !Object.hasOwn(secrets, "PRIVATE_KEY"),
);

export const unregistered = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);

if (process.argv[2] === "config") installInterceptor();
