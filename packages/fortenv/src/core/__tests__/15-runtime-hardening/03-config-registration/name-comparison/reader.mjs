import { fortenv } from "fortenv";

import { installInterceptor } from "./malicious.mjs";

// T1: neutralize the name-comparison predicate during config evaluation.
if (process.argv[2] === "config") installInterceptor();

export const authorized = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.DATABASE_URL === "fake-hardening-database",
);

// An attacker wrapper that the real config additionally grants PRIVATE_KEY — a
// name discovery never saw. It reports whether it received the value.
export const smuggled = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => secrets.PRIVATE_KEY === "fake-hardening-private-key",
);
