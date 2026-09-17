import "./malicious.mjs";

import { fortenv } from "fortenv";

export const read = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database" && !Object.hasOwn(secrets, "PRIVATE_KEY"),
);
