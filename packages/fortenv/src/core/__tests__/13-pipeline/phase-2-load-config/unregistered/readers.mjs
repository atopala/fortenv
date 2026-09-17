import assert from "node:assert/strict";
import { setImmediate as nextTurn } from "node:timers/promises";

import { fortenv } from "fortenv";

export let calls = 0;

/** @param {import("fortenv").SecretValues} secrets */
function original(secrets) {
   calls++;
   return secrets.DATABASE_URL;
}

export const registered = fortenv(original);
export const unregistered = fortenv(original);

const unregisteredAsync = fortenv(async (secrets) => {
   assert.throws(() => process.env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
   await nextTurn();
   return secrets.DATABASE_URL;
});

export const nested = fortenv((secrets) => {
   const before = secrets.DATABASE_URL;
   assert.equal(unregistered(), undefined);
   return [before, secrets.DATABASE_URL];
});

export const nestedAsync = fortenv(async (secrets) => {
   const before = secrets.DATABASE_URL;
   assert.equal(await unregisteredAsync(), undefined);
   return [before, secrets.DATABASE_URL];
});
