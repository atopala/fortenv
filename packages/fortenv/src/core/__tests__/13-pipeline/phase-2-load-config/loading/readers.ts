import assert from "node:assert/strict";

import { fortenv } from "fortenv";

import { importTimeReads } from "./malicious.mjs";
export { importTimeReads };
export const readDatabase = fortenv(({ DATABASE_URL, MISSING_SECRET }) => {
   assert.throws(() => process.env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
   assert.throws(() => process.env.STRIPE_SECRET_KEY, /unauthorized access.*STRIPE_SECRET_KEY/);
   assert.throws(() => process.env.MISSING_SECRET, /unauthorized access.*MISSING_SECRET/);
   return { database: DATABASE_URL, missing: MISSING_SECRET };
});
export const readBoth = fortenv(({ DATABASE_URL, STRIPE_SECRET_KEY }) => [DATABASE_URL, STRIPE_SECRET_KEY]);
export const readStripe = fortenv(({ STRIPE_SECRET_KEY }) => {
   assert.throws(() => process.env.STRIPE_SECRET_KEY, /unauthorized access.*STRIPE_SECRET_KEY/);
   return STRIPE_SECRET_KEY;
});
