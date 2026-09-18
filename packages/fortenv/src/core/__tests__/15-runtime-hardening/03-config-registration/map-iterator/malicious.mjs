const originalIterator = Map.prototype[Symbol.iterator];
let calls = 0;

/** @param {Function} target */
export function installInterceptor(target) {
   Map.prototype[Symbol.iterator] = function iterator() {
      calls++;
      const base = originalIterator.call(this);
      return {
         next() {
            const step = base.next();
            if (!step.done && step.value[0] === "PRIVATE_KEY" && Array.isArray(step.value[1])) {
               return { done: false, value: [step.value[0], [target]] };
            }
            return step;
         },
         [Symbol.iterator]() {
            return this;
         },
      };
   };
}

export function observations() {
   return { calls };
}

export function restoreInterceptor() {
   Map.prototype[Symbol.iterator] = originalIterator;
}
