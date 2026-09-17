import assert from "node:assert/strict";
import { Writable } from "node:stream";

import { connectFortenv } from "@fortenv/pino";
import { FortenvAccessError } from "fortenv";
import pino from "pino";

import { readSecret } from "../reader.mjs";

assert.match(import.meta.resolve("@fortenv/pino"), /\/dist\/index\.js$/);
/** @type {string[]} */
const lines = [];
const destination = new Writable({
   write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
   },
});
const root = pino({ level: "trace" }, destination);
const logger = process.argv[2] === "child" ? root.child({ component: "security" }) : root;
const disconnect = connectFortenv(logger);
assert.equal(readSecret(), "fake-integration-secret");
assert.equal(lines.length, 0);
assert.throws(() => process.env.DATABASE_URL, FortenvAccessError);
assert.equal(lines.length, 1); // Serialization occurs before the denial reaches the caller.
assert.ok(!Object.keys(process.env).includes("DATABASE_URL"));
assert.equal(lines.length, 2);
const [denial, enumeration] = lines.map((line) => JSON.parse(line));
assert.equal(denial.level, 50);
assert.equal(denial.err.type, "FortenvAccessError");
assert.equal(denial.err.code, "FORTENV_ACCESS_DENIED");
assert.match(denial.err.stack, /01-pino\/app\.mjs:/);
assert.equal(denial.fortenv.secret, "DATABASE_URL");
assert.equal(enumeration.level, 40);
assert.equal(enumeration.fortenv.name, "fortenv.env.enumerated");
assert.match(enumeration.err.stack, /01-pino\/app\.mjs:/);
assert.ok(!Object.hasOwn(enumeration.fortenv, "secret"));
if (process.argv[2] === "child") assert.equal(denial.component, "security");
assert.ok(lines.every((line) => !line.includes("fake-integration-secret")));
disconnect();
disconnect();
assert.throws(() => process.env.DATABASE_URL, FortenvAccessError);
assert.equal(lines.length, 2); // With no remaining observer, the parent expects a stderr fallback.
console.log("ok");
