import assert from "node:assert/strict";

const originalEnvironment = process.env;
await assert.rejects(import("fortenv/register"), /DEPENDENCY_FAILED_AFTER_PROTECTION/);

assert.equal(originalEnvironment.DATABASE_URL, undefined);
assert.throws(() => process.env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
assert.equal(process.env.NODE_ENV, "production");
console.log("ok");
