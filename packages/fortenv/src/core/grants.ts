import type { SecretEntries } from "./configuration.js";
import {
   addSetValue,
   createSet,
   createWeakMap,
   forEachArrayValue,
   forEachMapEntry,
   readWeakMap,
   stringifyJson,
   writeWeakMap,
} from "./intrinsics.js";

/** Build a fresh ACL; the runtime installs it only after all targets validate. */
export function buildGrants(
   entries: SecretEntries,
   isWrapper: (fn: Function) => boolean,
): WeakMap<Function, ReadonlySet<string>> {
   const next = createWeakMap<Function, Set<string>>();
   forEachMapEntry(entries, (name, functions) => {
      forEachArrayValue(functions, (fn) => {
         if (!isWrapper(fn)) {
            throw new Error(`Fortenv: grant target for ${stringifyJson(name)} is not wrapped with fortenv().`);
         }
         let allowed = readWeakMap(next, fn);
         if (!allowed) writeWeakMap(next, fn, (allowed = createSet()));
         addSetValue(allowed, name);
      });
   });
   return next;
}
