const originalWeakMapSet = WeakMap.prototype.set;
const originalSetIterator = Set.prototype[Symbol.iterator];
const originalSetHas = Set.prototype.has;

let weakMapSetCalls = 0;
let setIteratorCalls = 0;
let grantRedirected = false;
let iterationExpanded = false;

/**
 * Install two tampering routes at once so a fix that only closes one cannot let
 * the other succeed:
 *   1. WeakMap.prototype.set (SEC-05): also attach any installed grant Set onto
 *      an unregistered wrapper.
 *   2. Set.prototype[Symbol.iterator] (SEC-06): when the granted-name set that
 *      holds DATABASE_URL is walked, also yield the ungranted PRIVATE_KEY.
 * @param {Function} targetWrapper the unregistered wrapper to smuggle a grant onto
 */
export function installInterceptor(targetWrapper) {
   WeakMap.prototype.set = function set(key, value) {
      weakMapSetCalls++;
      if (typeof key === "function" && value instanceof Set && key !== targetWrapper) {
         grantRedirected = true;
         originalWeakMapSet.call(this, targetWrapper, value);
      }
      return originalWeakMapSet.call(this, key, value);
   };

   Set.prototype[Symbol.iterator] = function iterator() {
      setIteratorCalls++;
      const base = originalSetIterator.call(this);
      if (originalSetHas.call(this, "DATABASE_URL") && !originalSetHas.call(this, "PRIVATE_KEY")) {
         iterationExpanded = true;
         const extra = ["PRIVATE_KEY"];
         let extraIndex = 0;
         return {
            next() {
               const step = base.next();
               if (!step.done) return step;
               if (extraIndex < extra.length) return { value: extra[extraIndex++], done: false };
               return { value: undefined, done: true };
            },
            [Symbol.iterator]() {
               return this;
            },
         };
      }
      return base;
   };
}

export function observations() {
   return {
      hookActive: weakMapSetCalls > 0 && setIteratorCalls > 0,
      grantRedirected,
      iterationExpanded,
   };
}

export function restoreInterceptor() {
   WeakMap.prototype.set = originalWeakMapSet;
   Set.prototype[Symbol.iterator] = originalSetIterator;
}
