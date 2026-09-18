const originalArrayIterator = Array.prototype[Symbol.iterator];
let indexAccessorInstalled = false;
/** @type {PropertyDescriptor | undefined} */
let savedIndexDescriptor;
let calls = 0;
let intercepted = false;

/** @param {unknown} value */
function inspect(value) {
   if (typeof value === "object" && value !== null) {
      const descriptor =
         Object.getOwnPropertyDescriptor(value, "DATABASE_URL") ??
         Object.getOwnPropertyDescriptor(value, "PRIVATE_KEY");
      if (descriptor?.value === "fake-hardening-database" || descriptor?.value === "fake-hardening-private-key") {
         intercepted = true;
      }
   }
}

/**
 * Two attacker-controlled routes over the argument array Fortenv builds when it
 * calls the wrapped function as `fn(secrets, ...args)`:
 *   1. An inherited accessor at index 0 of Array.prototype, in case the array is
 *      ever assembled through ordinary [[Set]] rather than array-literal define.
 *   2. A replaced Array.prototype[Symbol.iterator] that inspects each element it
 *      yields, in case argument spreading iterates a secret-bearing array.
 */
export function installInterceptor() {
   savedIndexDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, 0);
   Object.defineProperty(Array.prototype, 0, {
      configurable: true,
      set(/** @type {unknown} */ value) {
         calls++;
         inspect(value);
         Object.defineProperty(this, 0, { configurable: true, enumerable: true, writable: true, value });
      },
      get() {
         return undefined;
      },
   });
   indexAccessorInstalled = true;

   Array.prototype[Symbol.iterator] = function iterator() {
      const base = originalArrayIterator.call(this);
      return {
         next() {
            calls++;
            const step = base.next();
            if (!step.done) inspect(step.value);
            return step;
         },
         [Symbol.iterator]() {
            return this;
         },
      };
   };
}

export function observations() {
   return { calls, intercepted };
}

export function restoreInterceptor() {
   Array.prototype[Symbol.iterator] = originalArrayIterator;
   if (indexAccessorInstalled) {
      if (savedIndexDescriptor) Object.defineProperty(Array.prototype, 0, savedIndexDescriptor);
      else delete Array.prototype[0];
      indexAccessorInstalled = false;
   }
}

if (process.argv[2] === "config") installInterceptor();
