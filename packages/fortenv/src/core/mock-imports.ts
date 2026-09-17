import { defineConfig } from "../config.js";

function mockNamespace(specifier: string, placeholders: WeakSet<Function>): object {
   const members = new Map<PropertyKey, Function>();
   return new Proxy(Object.create(null) as object, {
      get(_target, name) {
         if (!members.has(name)) {
            function unsupported(): never {
               throw new Error(
                  `Fortenv: imported values from ${JSON.stringify(specifier)} may only be used as grant references during discovery.`,
               );
            }
            const placeholder = new Proxy(unsupported, {
               apply: unsupported,
               construct: unsupported,
               get: unsupported,
               set: unsupported,
            });
            placeholders.add(placeholder);
            members.set(name, placeholder);
         }
         return members.get(name);
      },
      set: () => {
         throw new Error("Fortenv: discovery imports are read-only.");
      },
   });
}

export function createMockLoader(placeholders: WeakSet<Function>): (specifier: string) => { namespace: object } {
   const modules = new Map<string, object>();
   modules.set("fortenv/config", Object.freeze({ defineConfig }));
   return (specifier) => {
      let module = modules.get(specifier);
      if (!module) {
         module = mockNamespace(specifier, placeholders);
         modules.set(specifier, module);
      }
      // Wrap the namespace so await never mistakes an export named 'then' for a thenable.
      return { namespace: module };
   };
}
