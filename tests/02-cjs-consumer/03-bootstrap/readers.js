const { fortenv } = require("@fortenv/core");
const registered = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
const unregistered = fortenv.string((secrets) => secrets);
exports.registered = registered;
exports.unregistered = unregistered;
