import { fortenv } from "fortenv";

import { installInterceptor } from "./malicious.mjs";

// T1: install the malicious-but-working Map/Proxy BEFORE the wrapper is created,
// so the wrapper Proxy is constructed through the attacker's Proxy and its apply
// trap flows through attacker-controlled handler wrappers.
if (process.argv[2] === "config") installInterceptor();

export const authorized = fortenv.string(
   /** @param {import("fortenv").SecretValues<"DATABASE_URL">} secrets @param {string} arg */
   (secrets, arg) => secrets.DATABASE_URL === "fake-hardening-database" && arg === "business",
);
