import assert from "node:assert/strict";

import { createClient, createClientAsync } from "@fortenv-fixture/cjs-dependency";
import { FortenvAccessError } from "fortenv";

async function main() {
   /** @param {unknown} error */
   function denied(error) {
      assert.ok(error instanceof FortenvAccessError);
      assert.equal(error.code, "FORTENV_ACCESS_DENIED");
      assert.equal(error.secret, "DATABASE_URL");
      assert.ok(error.stack?.includes("index.js"));
      assert.ok(!error.stack?.includes("fake-module-secret"));
      return true;
   }
   if (process.argv[2] === "sync") assert.throws(() => createClient(true), denied);
   else if (process.argv[2] === "async") await assert.rejects(createClientAsync(true), denied);
   else throw new Error("Expected sync or async mode");
   console.log("ok");
}
await main();
