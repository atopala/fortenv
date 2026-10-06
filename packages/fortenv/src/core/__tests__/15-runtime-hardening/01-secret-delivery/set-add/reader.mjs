import "./malicious.mjs";

import { fortenv } from "@fortenv/secrets";

export const read = fortenv.string(
   /** @param {import("@fortenv/secrets").SecretValues<"DATABASE_URL" | "PRIVATE_KEY">} secrets */
   (secrets) => ({
      sawDatabase: secrets.DATABASE_URL === "fake-hardening-database",
      leakedPrivate: secrets.PRIVATE_KEY === "fake-hardening-private-key",
   }),
);
