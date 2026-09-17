import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { createClient } from "@fortenv-fixture/cjs-dependency";
const require = createRequire(import.meta.url);

async function main() {
   const imported = await import("@fortenv-fixture/cjs-dependency");
   const required = require("@fortenv-fixture/cjs-dependency");
   const config = (await import("./fortenv.config.mjs")).default;
   assert.equal(createClient, imported.createClient);
   assert.equal(createClient, required.createClient);
   assert.equal(createClient, config.secrets.DATABASE_URL[0]);
   assert.equal((await import("fortenv")).fortenv, require("fortenv").fortenv);
   assert.match(require.resolve("fortenv"), /[/\\]dist[/\\]index\.js$/);
   assert.equal(createClient().client.url, "fake-module-secret");
   console.log("ok");
}
await main();
