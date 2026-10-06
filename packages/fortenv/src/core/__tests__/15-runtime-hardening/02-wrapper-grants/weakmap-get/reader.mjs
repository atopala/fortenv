import { fortenv } from "@fortenv/secrets";

export const authorized = fortenv.string(
   /** @param {import("@fortenv/secrets").SecretValues<"DATABASE_URL" | "PRIVATE_KEY">} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database" && !Object.hasOwn(secrets, "PRIVATE_KEY"),
);

export const unregistered = fortenv.string(
   /** @param {import("@fortenv/secrets").SecretValues<"PRIVATE_KEY">} secrets */
   (secrets) => secrets.PRIVATE_KEY === "fake-hardening-private-key",
);
