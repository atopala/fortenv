import assert from "node:assert/strict";

import { createClient, createClientAsync } from "@fortenv-fixture/esm-dependency";

async function main() {
   const result = createClient();
   assert.equal(result.client.url, "fake-module-secret");
   assert.equal(result.client.format, "esm");
   assert.deepEqual(result.keys, ["DATABASE_URL", "MISSING_SECRET"]);
   assert.equal(result.missing, undefined);
   assert.equal(result.other, undefined);
   assert.equal((await createClientAsync()).url, "fake-module-secret");
   assert.equal(process.env.NODE_ENV, "test");
   assert.equal(Object.keys(process.env).includes("DATABASE_URL"), false);
   console.log("ok");
}
await main();
