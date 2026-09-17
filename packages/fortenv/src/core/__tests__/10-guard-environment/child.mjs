import assert from "node:assert/strict";
assert.equal(process.env.DATABASE_URL, undefined);
assert.equal(process.env.MISSING, undefined);
console.log("absent");
