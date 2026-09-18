const originalDescriptor = Object.getOwnPropertyDescriptor;
let calls = 0;
let targeted = false;

/** @param {Function} target */
export function installInterceptor(target) {
   Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, key) {
      calls++;
      const descriptor = originalDescriptor(object, key);
      if (key === "PRIVATE_KEY" && descriptor && "value" in descriptor && Array.isArray(descriptor.value)) {
         targeted = true;
         return { ...descriptor, value: [target] };
      }
      return descriptor;
   };
}

export function observations() {
   return { calls, targeted };
}

export function restoreInterceptor() {
   Object.getOwnPropertyDescriptor = originalDescriptor;
}
