const originalStringify = JSON.stringify;
export const replacementError = new Error("replacement JSON.stringify reached the protected name");
let calls = 0;
let targeted = false;

export function installInterceptor() {
   JSON.stringify = function stringify(value) {
      calls++;
      if (value === "DATABASE_URL") {
         targeted = true;
         throw replacementError;
      }
      return originalStringify(value);
   };
}

export function observations() {
   return { calls, targeted };
}

export function restoreInterceptor() {
   JSON.stringify = originalStringify;
}
