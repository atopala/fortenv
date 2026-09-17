import assert from "node:assert/strict";

import { fail, later, result } from "./factories.ts";
const object = {};
assert.equal(result(object), object);
const promise = Promise.resolve(object);
assert.equal(result(promise), promise);
const thenable = { then: () => {} };
assert.equal(result(thenable), thenable);
const failure = new Error("fixture failure");
assert.throws(
   () => fail(failure),
   (error) => error === failure,
);
const rejection = Promise.reject(failure);
assert.equal(result(rejection), rejection);
await assert.rejects(rejection, (error) => error === failure);
/** @type {() => void} */
let release = () => {};
/** @type {Promise<void>} */
const wait = new Promise((resolve) => {
   release = resolve;
});
const first = later(wait);
const second = later(Promise.resolve());
assert.throws(() => process.env.DATABASE_URL, /unauthorized access/);
const secondValue = await second;
release();
const firstValue = await first;
assert.equal(firstValue.DATABASE_URL, "fake-db");
assert.equal(secondValue.DATABASE_URL, "fake-db");
assert.notEqual(firstValue, secondValue);
console.log("ok");
