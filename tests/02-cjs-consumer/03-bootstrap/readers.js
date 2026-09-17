const { fortenv } = require("fortenv");
const registered = fortenv(({ DATABASE_URL }) => DATABASE_URL);
const unregistered = fortenv((secrets) => secrets);
exports.registered = registered;
exports.unregistered = unregistered;
