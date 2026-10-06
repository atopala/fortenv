const assert = require("node:assert/strict");
const { registered } = require("./readers.js");
assert.throws(() => registered(), /Fortenv: not initialized; start Node with --import @fortenv\/secrets\/register/);
console.log("ok");
