import "./malicious.mjs";

import { fortenv } from "@fortenv/secrets";

export const read = fortenv.string(
   /** @param {import("@fortenv/secrets").SecretValues<"DATABASE_URL" | "PRIVATE_KEY">} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database" && !Object.hasOwn(secrets, "PRIVATE_KEY"),
);
