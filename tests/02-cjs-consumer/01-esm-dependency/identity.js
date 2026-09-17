const assert = require("node:assert/strict");
const { createClient } = require("@fortenv-fixture/esm-dependency");

async function main() {
   const imported = await import("@fortenv-fixture/esm-dependency");
   const required = require("@fortenv-fixture/esm-dependency");
   const config = (await import("./fortenv.config.mjs")).default;
   assert.equal(createClient, imported.createClient);
   assert.equal(createClient, required.createClient);
   assert.equal(createClient, config.secrets.DATABASE_URL[0]);
   assert.equal((await import("fortenv")).fortenv, require("fortenv").fortenv);
   assert.match(require.resolve("fortenv"), /[/\\]dist[/\\]index\.js$/);
   assert.equal(createClient().client.url, "fake-module-secret");
   console.log("ok");
}
main().catch((error) => {
   console.error(error);
   process.exitCode = 1;
});
