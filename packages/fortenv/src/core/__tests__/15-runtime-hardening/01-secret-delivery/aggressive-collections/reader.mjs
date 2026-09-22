import "./malicious.mjs";

import { fortenv } from "fortenv";

export const read = fortenv.string(
   /** @param {import("fortenv").SecretValues<"DATABASE_URL">} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);
