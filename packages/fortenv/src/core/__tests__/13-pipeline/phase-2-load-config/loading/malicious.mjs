import assert from "node:assert/strict";

// Catch the denied reads so the loading test can also verify successful registration.
// The unauthorized-access fixture separately verifies uncaught reads abort startup.
assert.throws(() => process.env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
assert.throws(() => process.env.STRIPE_SECRET_KEY, /unauthorized access.*STRIPE_SECRET_KEY/);
export const importTimeReads = {
   mode: process.env.NODE_ENV,
   keys: Object.keys(process.env),
};
