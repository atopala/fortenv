import assert from "node:assert/strict";

import { registered, unregistered } from "./readers.js";
assert.equal(registered(), "fake-module-secret");
const secrets = unregistered();
assert.deepEqual(Object.keys(secrets), []);
// DATABASE_URL is not granted to this wrapper, so it is absent at runtime and outside
// the injected object's (empty) type; read it through a loose view to prove absence.
const secretsLoose = /** @type {import("fortenv").SecretValues} */ (secrets);
assert.equal(secretsLoose.DATABASE_URL, undefined);
assert.equal(Object.getPrototypeOf(secrets), null);
assert.equal(Object.isFrozen(secrets), true);
assert.throws(() => process.env.DATABASE_URL, { code: "FORTENV_ACCESS_DENIED" });
console.log("ok");
