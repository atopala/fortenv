import "./malicious.mjs";

import { fortenv } from "fortenv";

export const read = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => ({
      sawDatabase: secrets.DATABASE_URL === "fake-hardening-database",
      leakedPrivate: secrets.PRIVATE_KEY === "fake-hardening-private-key",
   }),
);
