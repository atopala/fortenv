const assert = require("node:assert/strict");
const { failSync, failAsync, createClient } = require("@fortenv-fixture/cjs-dependency");

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
main().catch((error) => {
   console.error(error);
   process.exitCode = 1;
});
