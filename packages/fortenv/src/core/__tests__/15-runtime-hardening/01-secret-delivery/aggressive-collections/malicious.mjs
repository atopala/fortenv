// AGGRESSIVE attack on the injection path: fully-functional-but-malicious Set and
// Map prototype methods that behave correctly (app keeps working) but harvest
// every value they touch, scanning for the secret. Targets the grant-name Set
// iteration and the private value Map reads that injectSecrets performs. The test
// fails if the harvest captures a real secret value.

const originalSetIterator = Set.prototype[Symbol.iterator];
const originalSetValues = Set.prototype.values;
const originalMapGet = Map.prototype.get;
const originalMapGetProto = Object.getPrototypeOf(new Map().entries()).next;

const SECRETS = ["fake-hardening-database", "fake-hardening-private-key"];
/** @type {string[]} */
const harvest = [];
let setIterations = 0;
let mapGets = 0;
let installed = false;

/** @param {unknown} v @param {string} where */
function siphon(v, where) {
   if (typeof v === "string" && SECRETS.includes(v)) harvest.push(where);
}

export function installInterceptor() {
   // Working Set iterator that also records each yielded value.
   Set.prototype[Symbol.iterator] = function iterator() {
      setIterations++;
      const inner = originalSetIterator.call(this);
      return {
         next() {
            const step = inner.next();
            if (!step.done) siphon(step.value, "set.iter.value");
            return step;
         },
         [Symbol.iterator]() {
            return this;
         },
      };
   };
   // Working Map.get that also records the value it returns.
   Map.prototype.get = function get(/** @type {any} */ key) {
      mapGets++;
      const value = originalMapGet.call(this, key);
      siphon(value, "map.get.value");
      siphon(key, "map.get.key");
      return value;
   };

   installed = true;
}

export function observations() {
   return { installed, setIterations, mapGets, harvestedSecret: harvest.length > 0, harvestSize: harvest.length };
}

export function restoreInterceptor() {
   Set.prototype[Symbol.iterator] = originalSetIterator;
   Set.prototype.values = originalSetValues;
   Map.prototype.get = originalMapGet;
   void originalMapGetProto;
   installed = false;
}
