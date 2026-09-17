const { fortenv } = require("fortenv");

class Client {
   /** @param {string | undefined} url @param {boolean} probe */
   constructor(url, probe) {
      if (probe) void process.env.DATABASE_URL;
      this.url = url;
      this.format = "cjs";
   }
}

const createClient = fortenv((secrets, /** @type {boolean} */ probe = false) => ({
   client: new Client(secrets.DATABASE_URL, probe),
   keys: Object.keys(secrets),
   missing: secrets.MISSING_SECRET,
   other: secrets.OTHER_SECRET,
}));
const createClientAsync = fortenv(async (secrets, /** @type {boolean} */ probe = false) => {
   await Promise.resolve();
   return new Client(secrets.DATABASE_URL, probe);
});
const failSync = fortenv((_secrets, /** @type {Error} */ error) => {
   throw error;
});
const failAsync = fortenv(async (_secrets, /** @type {Error} */ error) => {
   await Promise.resolve();
   throw error;
});

exports.createClient = createClient;
exports.createClientAsync = createClientAsync;
exports.failSync = failSync;
exports.failAsync = failAsync;
