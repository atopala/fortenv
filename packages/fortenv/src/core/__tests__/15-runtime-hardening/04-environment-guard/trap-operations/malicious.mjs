// Replace the global operations the env-guard traps use internally, at T2 (after
// bootstrap), then let the app probe protected reads and enumeration. The goal is
// to make a protected read return its value, or leak a protected name.

const originalReflectGet = Reflect.get;
const originalReflectOwnKeys = Reflect.ownKeys;
const originalArrayFilter = Array.prototype.filter;
let installed = false;

export function installInterceptor() {
   // If the guard consults a replaced Reflect.get for a protected key, feed back a value.
   Reflect.get = /** @type {typeof Reflect.get} */ (
      function get(/** @type {object} */ target, /** @type {PropertyKey} */ key, /** @type {unknown} */ receiver) {
         if (key === "PRIVATE_KEY" || key === "DATABASE_URL") return "attacker-substituted";
         return originalReflectGet(target, key, receiver);
      }
   );
   // If ownKeys filtering runs through a replaced filter, neutralize the filter so
   // protected names would survive enumeration.
   Array.prototype.filter = function filter() {
      return originalArrayFilter.call(this, () => true);
   };
   // If enumeration reflection is replaced, pass through (probe point).
   Reflect.ownKeys = function ownKeys(target) {
      return originalReflectOwnKeys(target);
   };
   installed = true;
}

export function observations() {
   return { installed };
}

export function restoreInterceptor() {
   Reflect.get = originalReflectGet;
   Reflect.ownKeys = originalReflectOwnKeys;
   Array.prototype.filter = originalArrayFilter;
   installed = false;
}
