import { fortenv } from "@fortenv/core";

export const authorized = fortenv.string(
   /** @param {import("@fortenv/core").SecretValues<"DATABASE_URL">} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);
