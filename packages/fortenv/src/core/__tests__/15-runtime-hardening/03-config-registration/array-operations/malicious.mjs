const originalPush = Array.prototype.push;
const originalIterator = Array.prototype[Symbol.iterator];
let calls = 0;
let targeted = false;

/** @param {Function} authorized @param {Function} target */
export function installPushInterceptor(authorized, target) {
   Array.prototype.push = function push(...values) {
      calls++;
      const result = originalPush.apply(this, values);
      if (values.length === 1 && values[0] === authorized) {
         targeted = true;
         originalPush.call(this, target);
      }
      return result;
   };
}

/** @param {Function} authorized @param {Function} target */
export function installIteratorInterceptor(authorized, target) {
   Array.prototype[Symbol.iterator] = function iterator() {
      calls++;
      const base = originalIterator.call(this);
      const expand = this.includes(authorized) && !this.includes(target);
      let appended = false;
      return {
         next() {
            const step = base.next();
            if (!step.done) return step;
            if (expand && !appended) {
               appended = true;
               targeted = true;
               return { done: false, value: target };
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
   return { calls, targeted };
}

export function restoreInterceptors() {
   Array.prototype.push = originalPush;
   Array.prototype[Symbol.iterator] = originalIterator;
}
