const { registered } = require("./readers.js");
console.log("before-early-call");
registered();
console.log("after-early-call");
