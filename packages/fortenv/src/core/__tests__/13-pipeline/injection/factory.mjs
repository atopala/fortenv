import assert from "node:assert/strict";

import { subscribeSecurityEvents } from "fortenv/telemetry";

import { createDb, Db, echo, outer, snapshot, unregistered } from "./factories.ts";
const db = createDb(20);
assert.ok(db instanceof Db);
assert.equal(db.url, "fake-db");
assert.equal(db.poolSize, 20);
assert.equal(createDb().poolSize, 10);
/** @type {unknown[]} */
const events = [];
const disconnect = subscribeSecurityEvents((event) => {
   events.push(event);
});
const first = snapshot();
assert.equal(Object.getPrototypeOf(first), null);
assert.ok(Object.isFrozen(first));
assert.deepEqual(Object.keys(first), ["DATABASE_URL", "MISSING"]);
assert.equal(first.DATABASE_URL, "fake-db");
assert.equal(Object.hasOwn(first, "MISSING"), true);
assert.equal(first.MISSING, undefined);
assert.equal(Object.hasOwn(first, "OTHER_SECRET"), false);
// OTHER_SECRET is neither declared by the wrapper nor granted, so it is absent at
// runtime and outside the injected object's type; read it through a loose view.
const firstLoose = /** @type {import("fortenv").SecretValues} */ (first);
assert.equal(firstLoose.OTHER_SECRET, undefined);
assert.notEqual(first, snapshot());
assert.equal(Reflect.set(first, "DATABASE_URL", "forged"), false);
assert.equal(snapshot().DATABASE_URL, "fake-db");
assert.equal(Object.keys(unregistered()).length, 0);
const forged = { DATABASE_URL: "caller-supplied" };
const echoed = echo(forged);
assert.equal(echoed.value, forged);
assert.equal(echoed.secrets.DATABASE_URL, "fake-db");
assert.equal(outer().DATABASE_URL, "fake-db");
assert.deepEqual(events, []); // Successful injection, including missing values, is silent.
assert.throws(() => process.env.DATABASE_URL, /unauthorized access/);
assert.equal(events.length, 1);
disconnect();
console.log("ok");
