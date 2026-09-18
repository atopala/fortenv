import { fortenv } from "fortenv";

import { installInterceptor } from "./malicious.mjs";

export const authorized = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database" && !Object.hasOwn(secrets, "PRIVATE_KEY"),
);

// Never named in the config; must never receive a grant even if registration is tampered.
export const unregistered = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) =>
      secrets.DATABASE_URL === "fake-hardening-database" || secrets.PRIVATE_KEY === "fake-hardening-private-key",
);

// T1: install during config dependency evaluation, after both wrappers exist and
// before Fortenv builds grants from the real config.
if (process.argv[2] === "config") installInterceptor(unregistered);
