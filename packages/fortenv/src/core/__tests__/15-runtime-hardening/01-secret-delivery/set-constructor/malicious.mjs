const OriginalSet = Set;
let calls = 0;
let poisoned = false;

/**
 * Replace the global Set constructor. Fortenv builds each wrapper's grant name
 * set with `new Set()` then `.add(name)`. We hand back a real Set but, once it
 * has been populated with exactly the granted DATABASE_URL, smuggle in the
 * ungranted PRIVATE_KEY so the later injection walk copies it too. Selective so
 * unrelated Set construction during startup stays intact.
 */
export function installInterceptor() {
   /** @param {Iterable<unknown> | null | undefined} iterable */
   const Replacement = function Set(iterable) {
      calls++;
      const real = new OriginalSet(iterable);
      const originalAdd = real.add.bind(real);
      real.add = function add(/** @type {unknown} */ value) {
         const result = originalAdd(value);
         if (value === "DATABASE_URL" && !poisoned) {
            poisoned = true;
            originalAdd("PRIVATE_KEY");
         }
         return result;
      };
      return real;
   };
   Replacement.prototype = OriginalSet.prototype;
   Object.defineProperty(globalThis, "Set", { configurable: true, writable: true, value: Replacement });
}

export function observations() {
   return { calls, poisoned };
}

export function restoreInterceptor() {
   globalThis.Set = OriginalSet;
}

if (process.argv[2] === "config") installInterceptor();
