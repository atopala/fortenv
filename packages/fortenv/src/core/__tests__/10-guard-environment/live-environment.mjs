import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { env } from "node:process";
import { fileURLToPath } from "node:url";

import { protectEnvironment } from "../../../../dist/runtime/node/environment.js";

const original = process.env;
protectEnvironment(["DATABASE_URL", "MISSING"]);
assert.equal(original.DATABASE_URL, undefined);
assert.equal(env, process.env);
assert.equal(createRequire(import.meta.url)("node:process").env, process.env);
assert.throws(() => process.env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
assert.throws(() => env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
assert.throws(() => process.env.DATABASE_URL, /unauthorized access/);
assert.throws(() => process.env.MISSING, /unauthorized access/);
assert.throws(() => env.DATABASE_URL, /unauthorized access/);
assert.equal("DATABASE_URL" in env, false);
assert.equal(Object.getOwnPropertyDescriptor(env, "DATABASE_URL"), undefined);
assert.equal(Reflect.set(process, "env", {}), false);
assert.equal(Reflect.defineProperty(process, "env", { value: {} }), false);
assert.equal(Reflect.deleteProperty(process, "env"), false);
assert.throws(() => protectEnvironment([]), /another runtime instance/);
process.env.NODE_ENV = "production";
assert.equal(original.NODE_ENV, "production");
delete process.env.NODE_ENV;
assert.equal(original.NODE_ENV, undefined);

// A normal child receives the sanitized environment after injection has been installed.
const child = spawnSync(process.execPath, [fileURLToPath(new URL("./child.mjs", import.meta.url))], {
   encoding: "utf8",
});
assert.equal(child.status, 0, child.stderr);
assert.equal(child.stdout, "absent\n");
console.log("ok");
