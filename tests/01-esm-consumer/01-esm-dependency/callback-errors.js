import assert from "node:assert/strict";

import { createClient, failAsync, failSync } from "@fortenv-fixture/esm-dependency";

async function main() {
   const original = new Error("fixture callback failed");
   /** @param {unknown} error */
   const sameError = (error) => error === original;
   if (process.argv[2] === "sync") assert.throws(() => failSync(original), sameError);
   else if (process.argv[2] === "async") await assert.rejects(failAsync(original), sameError);
   else throw new Error("Expected sync or async mode");
   assert.equal(createClient().client.url, "fake-module-secret");
   assert.throws(() => process.env.DATABASE_URL, { code: "FORTENV_ACCESS_DENIED" });
   console.log("ok");
}
await main();
