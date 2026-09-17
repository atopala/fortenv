import assert from "node:assert/strict";

import { databaseUrl, stripeKey } from "../test-values.mjs";
import { originalEnvironment } from "./early.mjs";
import { importTimeReads, readBoth, readDatabase, readStripe } from "./readers.ts";

// Protection must precede real config imports, including transitive dependencies.
assert.equal(importTimeReads.mode, "production");
assert.ok(!importTimeReads.keys.includes("DATABASE_URL"));
assert.ok(!importTimeReads.keys.includes("STRIPE_SECRET_KEY"));

// Scrubbing removes the values from the original object, not just from a proxy view.
assert.equal(originalEnvironment.DATABASE_URL, undefined);
assert.equal(originalEnvironment.STRIPE_SECRET_KEY, undefined);
assert.throws(() => process.env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
assert.throws(() => process.env.STRIPE_SECRET_KEY, /unauthorized access.*STRIPE_SECRET_KEY/);
assert.equal(process.env.NODE_ENV, "production");

// These are the actual application wrappers also referenced by the real config.
assert.deepEqual(readDatabase(), { database: databaseUrl, missing: undefined });
assert.deepEqual(readBoth(), [databaseUrl, stripeKey]);
assert.equal(readStripe(), stripeKey);
assert.throws(() => process.env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
assert.throws(() => process.env.STRIPE_SECRET_KEY, /unauthorized access.*STRIPE_SECRET_KEY/);
console.log("ok");
