import assert from "node:assert/strict";

import * as telemetry from "fortenv/telemetry";

import { createEnvironmentGuard } from "../../../../../dist/runtime/node/environment.js";
const mode = process.argv[2];
const guard = createEnvironmentGuard({}, new Set(["DATABASE_URL"]), { enumeration: true });
let calls = 0;
/** @type {unknown[]} */
const nestedErrors = [];
let independentCalls = 0;
/** @type {string[][]} */
const enumerations = [];

function failingSink() {
   calls++;
   if (mode === "recursive") {
      // Assertions inside a managed sink could themselves be swallowed as sink failures.
      try {
         void guard.DATABASE_URL;
      } catch (error) {
         nestedErrors.push(error);
      }
      return;
   }
   if (mode === "async-recursive") {
      return Promise.resolve().then(() => {
         try {
            void guard.DATABASE_URL;
         } catch (error) {
            nestedErrors.push(error);
         }
      });
   }
   if (mode === "enumerates") {
      enumerations.push(Object.keys(guard));
      return;
   }
   if (mode === "rejected-promise") return Promise.reject(new Error("SINK_FAILED"));
   throw new Error("SINK_FAILED");
}

const disconnect = telemetry.subscribeSecurityEvents(failingSink);
const disconnectIndependent = telemetry.subscribeSecurityEvents(() => {
   independentCalls++;
});

try {
   assert.throws(() => guard.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
   // Allow uncaughtException/unhandledRejection delivery before claiming success.
   await new Promise((resolve) => setImmediate(resolve));
   assert.equal(calls, 1);
   assert.throws(() => guard.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
   await new Promise((resolve) => setImmediate(resolve));
   assert.equal(calls, 2); // A recursion guard must reset for the next independent read.
   assert.equal(independentCalls, 2); // One broken sink must not suppress other observers.
   if (mode === "recursive" || mode === "async-recursive") {
      assert.equal(nestedErrors.length, 2);
      for (const error of nestedErrors) {
         assert.ok(error instanceof Error);
         assert.match(error.message, /unauthorized access.*DATABASE_URL/);
         assert.equal(Reflect.get(error, "code"), "FORTENV_ACCESS_DENIED");
      }
   }
   if (mode === "enumerates") assert.deepEqual(enumerations, [[], []]);
   console.log("ok");
} finally {
   disconnect();
   disconnectIndependent();
}
