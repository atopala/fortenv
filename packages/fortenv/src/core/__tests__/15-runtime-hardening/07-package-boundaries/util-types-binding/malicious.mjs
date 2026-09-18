import { createRequire } from "node:module";
import { syncBuiltinESMExports } from "node:module";

// Attempt to tamper the `isGeneratorFunction` binding that runtime.ts imports
// from `node:util/types` and uses to reject generator wrappers. If Fortenv reads
// a live, mutable binding, forcing it to return false could let a generator be
// wrapped — the probe then checks whether that can leak a secret.

const require = createRequire(import.meta.url);
let installed = false;

export function installInterceptor() {
   const types = require("node:util/types");
   // Force the CommonJS export to always say "not a generator", then sync ESM.
   types.isGeneratorFunction = /** @type {typeof types.isGeneratorFunction} */ (/** @type {unknown} */ (() => false));
   syncBuiltinESMExports();
   installed = true;
}

export function observations() {
   return {
      installed,
      currentlyReturnsFalse: require("node:util/types").isGeneratorFunction(function* () {}) === false,
   };
}
