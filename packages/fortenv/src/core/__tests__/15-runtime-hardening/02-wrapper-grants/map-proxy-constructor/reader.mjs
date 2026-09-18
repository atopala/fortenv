import { fortenv } from "fortenv";

import { installInterceptor } from "./malicious.mjs";

// T1: replace the global Map and Proxy constructors during config evaluation,
// BEFORE the wrappers below are created, so the wrapper Proxy (and any Map the
// config/bootstrap path builds) is constructed through the replacements.
if (process.argv[2] === "config") installInterceptor();

export const authorized = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database" && !Object.hasOwn(secrets, "PRIVATE_KEY"),
);

export const unregistered = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) =>
      secrets.DATABASE_URL === "fake-hardening-database" || secrets.PRIVATE_KEY === "fake-hardening-private-key",
);
