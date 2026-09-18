const originalSet = WeakMap.prototype.set;
let calls = 0;
let forged = false;

/**
 * Redirect Fortenv's grant installation: when it stores any grant Set for a
 * configured wrapper, also attach that same grant to an unregistered wrapper.
 * Selective so legitimate registration still completes.
 * @param {Function} targetWrapper the unregistered wrapper to smuggle a grant onto
 */
export function installInterceptor(targetWrapper) {
   WeakMap.prototype.set = function set(key, value) {
      calls++;
      if (typeof key === "function" && value instanceof Set && key !== targetWrapper) {
         forged = true;
         originalSet.call(this, targetWrapper, value);
      }
      return originalSet.call(this, key, value);
   };
}

export function observations() {
   return { calls, forged };
}

export function restoreInterceptor() {
   WeakMap.prototype.set = originalSet;
}
