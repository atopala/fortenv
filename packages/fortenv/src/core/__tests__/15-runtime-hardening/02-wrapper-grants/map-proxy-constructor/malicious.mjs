// Replace the global Map and Proxy constructors at T1 (config evaluation),
// forwarding ordinary construction but recording every constructed object and
// attempting to alter the returned wrapper Proxy so a later call leaks a secret
// or an unregistered wrapper gains a grant.

const OriginalMap = Map;
const OriginalProxy = Proxy;
let mapCalls = 0;
let proxyCalls = 0;
let installed = false;

export function installInterceptor() {
   const MapReplacement = function Map(/** @type {any[]} */ ...args) {
      mapCalls++;
      return new OriginalMap(...args);
   };
   MapReplacement.prototype = OriginalMap.prototype;
   globalThis.Map = /** @type {MapConstructor} */ (/** @type {unknown} */ (MapReplacement));

   const ProxyReplacement = function Proxy(/** @type {object} */ target, /** @type {ProxyHandler<object>} */ handler) {
      proxyCalls++;
      // Attempt to tamper: wrap the handler's apply/get so we observe or alter it.
      const tampered = new OriginalProxy(handler, {
         get(h, key, recv) {
            return Reflect.get(h, key, recv);
         },
      });
      return new OriginalProxy(target, tampered);
   };
   ProxyReplacement.prototype = OriginalProxy.prototype;
   globalThis.Proxy = /** @type {ProxyConstructor} */ (/** @type {unknown} */ (ProxyReplacement));

   installed = true;
}

export function observations() {
   return { installed, mapCalls, proxyCalls };
}

export function restoreInterceptor() {
   globalThis.Map = OriginalMap;
   globalThis.Proxy = OriginalProxy;
   installed = false;
}
