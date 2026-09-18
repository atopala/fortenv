import "./malicious.mjs";

import { fortenv } from "fortenv";

// Authorized for DATABASE_URL only. A secure runtime never lets a replaced Set
// constructor smuggle PRIVATE_KEY into this wrapper's grant set.
export const read = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => ({
      sawDatabase: secrets.DATABASE_URL === "fake-hardening-database",
      leakedPrivate: secrets.PRIVATE_KEY === "fake-hardening-private-key",
   }),
);
