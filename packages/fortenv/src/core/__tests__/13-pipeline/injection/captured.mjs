import assert from "node:assert/strict";

import { captured } from "./factories.ts";
const outcome = process.argv[2];
assert.ok(outcome);
/** @type {unknown} */
let result;
const detached = new Promise((resolve) => {
   if (outcome === "throw") assert.throws(() => captured(resolve, outcome), /fixture failure/);
   else result = captured(resolve, outcome);
});
if (outcome === "reject") await assert.rejects(Promise.resolve(result), /fixture failure/);
else if (outcome !== "throw") assert.equal(await result, "fake-db");
assert.equal(await detached, "fake-db"); // Explicitly delivered strings cannot be revoked.
console.log("ok");
