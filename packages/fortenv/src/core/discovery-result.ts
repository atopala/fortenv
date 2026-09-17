import { readConfiguration, type SecretEntries } from "./configuration.js";

/** Validate the evaluated config and require imported placeholders as grant targets. */
export function readDiscoveryResult(value: unknown, placeholders: WeakSet<Function>): SecretEntries {
   const entries = readConfiguration(value);
   for (const functions of entries.values()) {
      if (functions.some((fn) => !placeholders.has(fn))) {
         throw new Error("grant references must come from imported modules");
      }
   }
   return entries;
}
