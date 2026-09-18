// Prototype pollution installed during config evaluation (T1). The goal is to
// make Fortenv read an inherited property as configuration, injection, or a
// grant — or to make an empty grant array appear non-empty.
//
// Two vectors, selected by the fixture:
//   objectData  — Object.prototype string keys (data + accessor) for the secret names.
//   arrayIndex  — Array.prototype numeric index 0 so an empty grant array "has" an element.

/** @type {Map<PropertyKey, PropertyDescriptor | undefined>} */
const savedObject = new Map();
/** @type {PropertyDescriptor | undefined} */
let savedArrayIndex;
let arrayPolluted = false;
let touched = 0;

/**
 * @param {object} target
 * @param {PropertyKey} key
 * @param {PropertyDescriptor} descriptor
 * @param {Map<PropertyKey, PropertyDescriptor | undefined>} store
 */
function pollute(target, key, descriptor, store) {
   store.set(key, Object.getOwnPropertyDescriptor(target, key));
   Object.defineProperty(target, key, descriptor);
}

/** @param {string} vector */
export function installInterceptor(vector) {
   if (vector === "objectData") {
      // A plain data property and an accessor that records reads and returns a fake value.
      pollute(
         Object.prototype,
         "DATABASE_URL",
         { configurable: true, enumerable: true, value: "fake-hardening-database" },
         savedObject,
      );
      pollute(
         Object.prototype,
         "PRIVATE_KEY",
         {
            configurable: true,
            enumerable: true,
            get() {
               touched++;
               return "fake-hardening-private-key";
            },
         },
         savedObject,
      );
   } else if (vector === "arrayIndex") {
      savedArrayIndex = Object.getOwnPropertyDescriptor(Array.prototype, 0);
      // A writable data property at index 0 of every array. Unlike an accessor,
      // this does not break Node's own array writes, so the probe stays scoped to
      // the security question: does an empty grant array inherit this element?
      Object.defineProperty(Array.prototype, 0, {
         configurable: true,
         enumerable: true,
         writable: true,
         value: "PRIVATE_KEY",
      });
      arrayPolluted = true;
   }
}

export function observations() {
   return { touched };
}

export function restoreInterceptor() {
   for (const [key, descriptor] of savedObject) {
      if (descriptor) Object.defineProperty(Object.prototype, key, descriptor);
      else Reflect.deleteProperty(Object.prototype, key);
   }
   savedObject.clear();
   if (arrayPolluted) {
      if (savedArrayIndex) Object.defineProperty(Array.prototype, 0, savedArrayIndex);
      else Reflect.deleteProperty(Array.prototype, 0);
      arrayPolluted = false;
   }
}
