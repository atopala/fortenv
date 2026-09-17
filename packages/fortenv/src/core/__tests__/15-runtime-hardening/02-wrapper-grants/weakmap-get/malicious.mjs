const originalGet = WeakMap.prototype.get;
let calls = 0;
let forged = false;

/** @param {Function} targetWrapper */
export function installInterceptor(targetWrapper) {
   WeakMap.prototype.get = function get(key) {
      calls++;
      if (key === targetWrapper) {
         forged = true;
         return new Set(["PRIVATE_KEY"]);
      }
      return originalGet.call(this, key);
   };
}

export function observations() {
   return { calls, forged };
}

export function restoreInterceptor() {
   WeakMap.prototype.get = originalGet;
}
