import assert from "node:assert/strict";

import { databaseUrl } from "../test-values.mjs";
import { nested, nestedAsync } from "./readers.mjs";

assert.deepEqual(nested(), [databaseUrl, databaseUrl]);
assert.throws(() => process.env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
assert.deepEqual(await nestedAsync(), [databaseUrl, databaseUrl]);
assert.throws(() => process.env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
console.log("ok");
