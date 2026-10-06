import { fortenv } from "@fortenv/secrets";

import { installInterceptor } from "./malicious.mjs";

export const authorized = fortenv.string(
   /** @param {import("@fortenv/secrets").SecretValues<"DATABASE_URL">} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);

export const unregistered = fortenv.string(
   /** @param {import("@fortenv/secrets").SecretValues<"PRIVATE_KEY">} secrets */
   (secrets) => secrets.PRIVATE_KEY === "fake-hardening-private-key",
);

if (process.argv[2] === "config") installInterceptor(unregistered);
