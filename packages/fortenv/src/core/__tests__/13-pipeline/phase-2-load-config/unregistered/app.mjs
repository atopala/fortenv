import assert from "node:assert/strict";

import { databaseUrl } from "../test-values.mjs";
import { calls, registered, unregistered } from "./readers.mjs";

assert.notEqual(registered, unregistered);
assert.equal(registered(), databaseUrl);
assert.equal(unregistered(), undefined);
assert.equal(calls, 2); // The unregistered call executes, but with no grant.
assert.throws(() => process.env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
console.log("ok");
