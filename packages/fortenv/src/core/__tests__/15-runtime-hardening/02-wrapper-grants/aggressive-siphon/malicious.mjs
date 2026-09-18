// AGGRESSIVE attack: fully-functional-but-malicious reimplementations of Map and
// Proxy. They behave exactly like the originals (so the app keeps working and
// nothing looks broken) but actively siphon every key, value, argument, and
// handler interaction into a private harvest, scanning for the secret. The test
// fails if the harvest ever captures a real secret value.

const OriginalMap = Map;
const OriginalProxy = Proxy;
const OriginalReflect = { apply: Reflect.apply, get: Reflect.get, construct: Reflect.construct };

const SECRETS = ["fake-hardening-database", "fake-hardening-private-key"];
/** @type {string[]} */
const harvest = [];
let mapCalls = 0;
let proxyCalls = 0;
let applyTrapArgsSeen = 0;
let installed = false;

/** Deep-scan any value for a known secret and record a hit. @param {unknown} v @param {string} where */
function siphon(v, where) {
   try {
      if (typeof v === "string") {
         if (SECRETS.includes(v)) harvest.push(`${where}:string`);
      } else if (v && typeof v === "object") {
         for (const key of Reflect.ownKeys(v)) {
            const d = Object.getOwnPropertyDescriptor(v, key);
            if (d && "value" in d && typeof d.value === "string" && SECRETS.includes(d.value)) {
               harvest.push(`${where}:prop:${String(key)}`);
            }
         }
      }
   } catch {
      /* never break the host app */
   }
}

export function installInterceptor() {
   // A working Map that stores real entries but copies every key/value out.
   class MaliciousMap extends OriginalMap {
      set(/** @type {any} */ key, /** @type {any} */ value) {
         mapCalls++;
         siphon(key, "map.key");
         siphon(value, "map.value");
         return super.set(key, value);
      }
      get(/** @type {any} */ key) {
         const value = super.get(key);
         siphon(value, "map.get");
         return value;
      }
   }
   globalThis.Map = /** @type {MapConstructor} */ (/** @type {unknown} */ (MaliciousMap));

   // A working Proxy whose construction wraps the caller's handler so that every
   // trap invocation is observed. Critically, for the wrapper's own `apply` trap
   // we inspect the arguments array — which is [secrets, ...businessArgs] — to try
   // to grab the injected secrets object as it flows to the real callback.
   const ProxyReplacement = function Proxy(/** @type {any} */ target, /** @type {any} */ handler) {
      proxyCalls++;
      /** @type {ProxyHandler<object>} */
      const wrappedHandler = {};
      for (const trap of Reflect.ownKeys(handler)) {
         const original = handler[trap];
         if (typeof original !== "function") continue;
         wrappedHandler[/** @type {keyof ProxyHandler<object>} */ (trap)] = function (
            /** @type {any[]} */ ...trapArgs
         ) {
            if (trap === "apply") {
               // trapArgs = [target, thisArg, argumentsList]
               const argumentsList = trapArgs[2];
               applyTrapArgsSeen++;
               if (Array.isArray(argumentsList)) for (const a of argumentsList) siphon(a, "apply.arg");
            }
            if (trap === "get") siphon(trapArgs[1], "get.key");
            const result = OriginalReflect.apply(original, handler, trapArgs);
            if (trap === "apply") siphon(result, "apply.result");
            return result;
         };
      }
      return new OriginalProxy(target, wrappedHandler);
   };
   ProxyReplacement.prototype = OriginalProxy.prototype;
   globalThis.Proxy = /** @type {ProxyConstructor} */ (/** @type {unknown} */ (ProxyReplacement));

   installed = true;
}

export function observations() {
   return {
      installed,
      mapCalls,
      proxyCalls,
      applyTrapArgsSeen,
      harvestedSecret: harvest.length > 0,
      harvestSize: harvest.length,
   };
}

export function restoreInterceptor() {
   globalThis.Map = OriginalMap;
   globalThis.Proxy = OriginalProxy;
   installed = false;
}
