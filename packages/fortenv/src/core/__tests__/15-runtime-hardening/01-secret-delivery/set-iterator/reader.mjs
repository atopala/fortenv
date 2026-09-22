import "./malicious.mjs";

import { fortenv } from "fortenv";

// Authorized for DATABASE_URL only. A secure runtime never lets iteration
// tampering add PRIVATE_KEY to this wrapper's injection object.
export const read = fortenv.string(
   /** @param {import("fortenv").SecretValues<"DATABASE_URL" | "PRIVATE_KEY">} secrets */
   (secrets) => ({
      sawDatabase: secrets.DATABASE_URL === "fake-hardening-database",
      leakedPrivate: secrets.PRIVATE_KEY === "fake-hardening-private-key",
   }),
);
