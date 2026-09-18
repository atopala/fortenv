const originalAdd = WeakSet.prototype.add;
let calls = 0;
/** @type {Function | undefined} */
let target;

/** @param {Function} rawTarget */
export function installInterceptor(rawTarget) {
   target = rawTarget;
   WeakSet.prototype.add = function add(value) {
      calls++;
      const result = originalAdd.call(this, value);
      if (typeof value === "function" && target !== undefined && value !== target) originalAdd.call(this, target);
      return result;
   };
}

export function assertHookActive() {
   new WeakSet().add({});
   if (calls === 0) throw new Error("WeakSet.add hook is inactive");
}

export function restoreInterceptor() {
   WeakSet.prototype.add = originalAdd;
}
