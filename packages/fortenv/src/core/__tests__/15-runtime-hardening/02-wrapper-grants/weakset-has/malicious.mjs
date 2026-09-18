const originalHas = WeakSet.prototype.has;
let calls = 0;

/** @param {Function} target */
export function installInterceptor(target) {
   WeakSet.prototype.has = function has(value) {
      calls++;
      if (value === target) return true;
      return originalHas.call(this, value);
   };
}

export function assertHookActive(/** @type {Function} */ target) {
   if (!new WeakSet().has(target) || calls === 0) throw new Error("WeakSet.has hook is inactive");
}

export function restoreInterceptor() {
   WeakSet.prototype.has = originalHas;
}
