const originalIterator = Set.prototype[Symbol.iterator];
const originalHas = Set.prototype.has;
let calls = 0;
let expanded = false;

/**
 * Replace Set iteration so that when Fortenv walks a grant name set that holds
 * DATABASE_URL, the walk also yields the ungranted PRIVATE_KEY name. Selective
 * so unrelated Set iteration during startup is unaffected.
 */
export function installInterceptor() {
   Set.prototype[Symbol.iterator] = function iterator() {
      calls++;
      const base = originalIterator.call(this);
      if (originalHas.call(this, "DATABASE_URL") && !originalHas.call(this, "PRIVATE_KEY")) {
         expanded = true;
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
   return { calls, expanded };
}

export function restoreInterceptor() {
   Set.prototype[Symbol.iterator] = originalIterator;
}

if (process.argv[2] === "config") installInterceptor();
