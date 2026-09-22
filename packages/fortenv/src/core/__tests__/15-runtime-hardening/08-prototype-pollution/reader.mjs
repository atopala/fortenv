import { fortenv } from "fortenv";

import { installInterceptor } from "./malicious.mjs";

// Authorized for DATABASE_URL only. Reports whether it saw its grant and whether
// prototype pollution leaked the ungranted PRIVATE_KEY into its injected object.
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

// T1: pollute prototypes during config dependency evaluation, before Fortenv
// validates the real config and builds grants.
const vector = process.argv[2];
if (vector === "objectData" || vector === "arrayIndex") installInterceptor(vector);
