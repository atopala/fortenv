import { fortenv } from "@fortenv/secrets";

export const authorized = fortenv.string(
   /** @param {import("@fortenv/secrets").SecretValues<"DATABASE_URL">} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);
