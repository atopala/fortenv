import type { SecretEntries } from "./configuration.js";
import { readWeakMap } from "./intrinsics.js";

/** Build a fresh ACL; the runtime installs it only after all targets validate. */
export function buildGrants(
   entries: SecretEntries,
   isWrapper: (fn: Function) => boolean,
): WeakMap<Function, ReadonlySet<string>> {
   const next = new WeakMap<Function, Set<string>>();
   for (const [name, functions] of entries) {
      for (const fn of functions) {
         if (!isWrapper(fn)) {
            throw new Error(`Fortenv: grant target for ${JSON.stringify(name)} is not wrapped with fortenv().`);
         }
         let allowed = readWeakMap(next, fn);
         if (!allowed) next.set(fn, (allowed = new Set()));
         allowed.add(name);
      }
   }
   return next;
}
