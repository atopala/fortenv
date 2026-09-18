import { fortenv } from "fortenv";

import { installInterceptor } from "./malicious.mjs";

export const authorized = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);

export const unregistered = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.PRIVATE_KEY === "fake-hardening-private-key",
);

if (process.argv[2] === "config") installInterceptor(unregistered);
