import { fortenv } from "fortenv";

import { installInterceptor } from "./malicious.mjs";

// Authorized for DATABASE_URL only. Reports both whether it saw its grant and
// whether iteration tampering leaked the ungranted PRIVATE_KEY into its object.
export const authorized = fortenv.string(
   /** @param {import("fortenv").SecretValues<"DATABASE_URL" | "PRIVATE_KEY">} secrets */
   (secrets) => ({
      sawDatabase: secrets.DATABASE_URL === "fake-hardening-database",
      leakedPrivate: secrets.PRIVATE_KEY === "fake-hardening-private-key",
   }),
);

// Never named in the config; must never receive a grant.
export const unregistered = fortenv.string(
   /** @param {import("fortenv").SecretValues<"DATABASE_URL" | "PRIVATE_KEY">} secrets */
   (secrets) =>
      secrets.DATABASE_URL === "fake-hardening-database" || secrets.PRIVATE_KEY === "fake-hardening-private-key",
);

// T1: install both hooks during config loading, after the wrappers exist and
// before Fortenv builds grants from the real config.
if (process.argv[2] === "config") installInterceptor(unregistered);
