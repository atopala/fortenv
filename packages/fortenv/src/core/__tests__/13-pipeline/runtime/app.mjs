import assert from "node:assert/strict";

import { FortenvAccessError } from "fortenv";

import {
   ambientAtImport,
   concurrentA,
   concurrentB,
   detached,
   helper,
   outer,
   readA,
   rejects,
   throws,
} from "./readers.ts";

const deniedA = new FortenvAccessError("SECRET_A");
const deniedB = new FortenvAccessError("SECRET_B");
assert.deepEqual(ambientAtImport, [deniedA, deniedB]);
assert.deepEqual(helper(), [deniedA, deniedB]);
assert.deepEqual(readA.call({ label: "receiver" }, 42), {
   values: ["fake-a", undefined],
   label: "receiver",
   argument: 42,
});
assert.deepEqual(await outer(), [
   ["fake-a", undefined],
   [undefined, "fake-b"],
   ["fake-a", undefined],
]);

/** @type {() => void} */
let signalA = () => {};
/** @type {() => void} */
let signalB = () => {};
/** @type {Promise<void>} */
const startedA = new Promise((resolve) => {
   signalA = resolve;
});
/** @type {Promise<void>} */
const startedB = new Promise((resolve) => {
   signalB = resolve;
});
const results = await Promise.all([concurrentA(startedB, signalA), concurrentB(startedA, signalB)]);
assert.deepEqual(results, [
   ["fake-a", undefined],
   [undefined, "fake-b"],
]);

const afterReturn = new Promise((resolve) => {
   assert.deepEqual(detached(resolve), ["fake-a", undefined]);
});
assert.deepEqual(await afterReturn, [deniedA, deniedB]);
const failure = new Error("intentional fixture failure");
const afterThrow = new Promise((resolve) => {
   assert.throws(
      () => throws(failure, resolve),
      (error) => error === failure,
   );
});
assert.deepEqual(await afterThrow, [deniedA, deniedB]);
/** @type {Promise<unknown>} */
let rejection = Promise.resolve();
const afterReject = new Promise((resolve) => {
   rejection = rejects(failure, resolve);
});
await assert.rejects(rejection, (error) => error === failure);
assert.deepEqual(await afterReject, [deniedA, deniedB]);
assert.deepEqual(helper(), [deniedA, deniedB]);
console.log("ok");
