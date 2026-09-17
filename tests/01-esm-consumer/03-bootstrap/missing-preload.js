import assert from "node:assert/strict";

import { registered } from "./readers.js";
assert.throws(() => registered(), /Fortenv: not initialized; start Node with --import fortenv\/register/);
console.log("ok");
