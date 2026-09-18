import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { env as importedEnv } from "node:process";

import { FortenvAccessError } from "fortenv";

// SEC-16: after bootstrap, try to re-acquire the protected secret through every
// route that resolves to the process environment. All must be the guarded object
// and deny the protected read. A reference captured BEFORE preload (T0) and a
// separately-initialized child/worker are documented limitations, not leaks.

const require = createRequire(import.meta.url);

/** Attempt a protected read via a given env object; returns whether it was denied.
 * @param {() => NodeJS.ProcessEnv} getEnv @param {string} label */
function readDenied(getEnv, label) {
   try {
      const value = getEnv().PRIVATE_KEY;
      // Reached only if the guard did not throw — a leak unless value is undefined.
      return { label, denied: false, gotValue: value === "fake-hardening-private-key" };
   } catch (error) {
      return {
         label,
         denied: error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED",
         gotValue: false,
      };
   }
}

const routes = [
   readDenied(() => process.env, "process.env"),
   readDenied(() => globalThis.process.env, "globalThis.process.env"),
   readDenied(() => require("node:process").env, "require(node:process).env"),
   readDenied(() => importedEnv, "import{env}"),
];

// A child process inherits the parent's (already-scrubbed) real environment; the
// protected key must not be present in it. This is normal child inheritance, not
// a Fortenv guard — the value was deleted from the underlying object at capture.
const child = spawnSync(process.execPath, ["-e", "process.stdout.write(String(process.env.PRIVATE_KEY))"], {
   encoding: "utf8",
   env: process.env,
});
const childSawSecret = child.stdout.includes("fake-hardening-private-key");

const allRoutesDenied = routes.every((r) => r.denied && !r.gotValue);
const anyRouteLeaked = routes.some((r) => r.gotValue);

console.log(
   JSON.stringify({
      routes: routes.map((r) => ({ label: r.label, denied: r.denied })),
      allRoutesDenied,
      anyRouteLeaked,
      childSawSecret,
   }),
);
