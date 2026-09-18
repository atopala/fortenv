const OriginalWeakMap = WeakMap;
const originalGet = WeakMap.prototype.get;
const originalSet = WeakMap.prototype.set;
/** @type {WeakMap<object, unknown>[]} */
const captured = [];
let calls = 0;
let registryCaptured = false;
let grantForged = false;

export function installInterceptor() {
   /** @param {Iterable<readonly [WeakKey, unknown]> | null | undefined} iterable */
   const Replacement = function WeakMap(iterable) {
      calls++;
      const map = new OriginalWeakMap(iterable);
      captured.push(map);
      return map;
   };
   Replacement.prototype = OriginalWeakMap.prototype;
   Object.defineProperty(globalThis, "WeakMap", { configurable: true, writable: true, value: Replacement });
}

/** @param {Function} authorized @param {Function} target */
export function forgeGrant(authorized, target) {
   for (const candidate of captured) {
      const allowed = originalGet.call(candidate, authorized);
      if (allowed instanceof Set) {
         registryCaptured = true;
         originalSet.call(candidate, target, allowed);
         grantForged = true;
      }
   }
}

export function observations() {
   return { calls, registryCaptured, grantForged };
}

export function restoreInterceptor() {
   globalThis.WeakMap = OriginalWeakMap;
}
