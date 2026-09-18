const originalAdd = Set.prototype.add;
let calls = 0;
let expanded = false;
let matchingDatabaseSets = 0;

export function installInterceptor() {
   Set.prototype.add = function add(value) {
      calls++;
      const result = originalAdd.call(this, value);
      if (value === "DATABASE_URL") {
         matchingDatabaseSets++;
         if (matchingDatabaseSets > 1) {
            expanded = true;
            originalAdd.call(this, "PRIVATE_KEY");
         }
      }
      return result;
   };
}

export function observations() {
   return { calls, expanded };
}

export function restoreInterceptor() {
   Set.prototype.add = originalAdd;
}

if (process.argv[2] === "config") installInterceptor();
