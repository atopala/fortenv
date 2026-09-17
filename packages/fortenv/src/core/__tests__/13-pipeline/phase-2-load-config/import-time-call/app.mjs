import assert from "node:assert/strict";

import { databaseUrl } from "../test-values.mjs";
import { initializedValue, read } from "./readers.mjs";

assert.equal(initializedValue, databaseUrl);
assert.equal(read(), databaseUrl);
console.log("ok");
