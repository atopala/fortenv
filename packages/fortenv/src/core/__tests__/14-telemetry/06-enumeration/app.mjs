import assert from "node:assert/strict";

import { authorizedScan, importTimeScan, read } from "./readers.mjs";

console.log("scan:authorized:before");
const authorizedResult = authorizedScan();
console.log("scan:authorized:after");
for (const scan of [importTimeScan, authorizedResult]) {
   const serialized = JSON.stringify(scan);
   assert.doesNotMatch(serialized, /DATABASE_URL|fake-enumeration-secret/);
   // The safe portion of the environment must still be available.
   switch (process.argv[2]) {
      case "keys":
      case "reflect":
      case "for-in":
         assert.ok(Array.isArray(scan));
         assert.ok(scan.some((value) => value === "NODE_ENV"));
         break;
      case "values":
         assert.ok(Array.isArray(scan));
         assert.ok(scan.some((value) => value === "production"));
         break;
      case "entries":
         assert.ok(Array.isArray(scan));
         assert.deepEqual(
            scan.find((entry) => Array.isArray(entry) && entry[0] === "NODE_ENV"),
            ["NODE_ENV", "production"],
         );
         break;
      case "spread":
         assert.ok(typeof scan === "object" && scan !== null);
         assert.equal(Reflect.get(scan, "NODE_ENV"), "production");
         break;
      case "json":
         assert.ok(typeof scan === "string");
         assert.equal(JSON.parse(scan).NODE_ENV, "production");
         break;
   }
}
assert.equal(read(), "fake-enumeration-secret");
assert.equal(process.env.NODE_ENV, "production");
// Enumeration flags must not disable the separate denied-read event or enforcement.
assert.throws(() => process.env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
console.log("ok");
