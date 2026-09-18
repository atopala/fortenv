// Attack bootstrap.matchingNames, the discovery-vs-real name-comparison. It uses
// Array.prototype.some over the discovered key list. We neutralize that predicate
// (fully-functional-but-malicious: ordinary .some still works) to try to slip a
// mismatched real config past the determinism guard.
//
// Note: matchingNames is a determinism guard, not the protection boundary.
// Protection happens at phase-1 capture of DISCOVERED names. A name only in the
// real config was never captured, so it is absent from the private value map —
// the security invariant this fixture asserts is that such a smuggled grant still
// yields no secret value, regardless of whether the guard is bypassed.

const originalSome = Array.prototype.some;
let someNeutralized = false;

export function installInterceptor() {
   Array.prototype.some = function some(/** @type {any} */ predicate, /** @type {any} */ thisArg) {
      const src = typeof predicate === "function" ? String(predicate) : "";
      if (src.includes("has(") || src.includes("actual") || src.includes("discovered")) {
         someNeutralized = true;
         return false;
      }
      return originalSome.call(this, predicate, thisArg);
   };
}

export function observations() {
   return { someNeutralized };
}

export function restoreInterceptor() {
   Array.prototype.some = originalSome;
}
